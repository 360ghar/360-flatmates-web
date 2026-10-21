import { getEnv } from "@/lib/env";
import { debug } from "@/lib/debug";
import { ApiClientError, mapStatusToAppError } from "./errors";

export const READ_TIMEOUT_MS = 20_000;
export const WRITE_TIMEOUT_MS = 60_000;

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>;

export interface ApiRequest<TBody = unknown> {
  method?: ApiMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
  auth?: boolean;
}

export interface ApiAdapter {
  request<TResponse, TBody = unknown>(
    request: ApiRequest<TBody>
  ): Promise<TResponse>;
}

export interface ApiClientOptions {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  onAuthFailure?: () => Promise<string | null>;
  /** Called on a 403 `USER_INACTIVE`: the account is deactivated, so the session must end. */
  onInactiveUser?: () => void;
  fetcher?: typeof fetch;
  defaultHeaders?: HeadersInit;
}

function resolveBaseUrl(baseUrl?: string): string {
  return (
    baseUrl ??
    getEnv().VITE_API_BASE_URL
  ).replace(/\/$/, "");
}

export function buildApiUrl(
  baseUrl: string,
  path: string,
  query: Record<string, QueryValue> = {}
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl.replace(/\/$/, "")}${normalizedPath}`);

  // NOTE (F10 #25): the explicit null/undefined/empty-string skip is the
  // intended behavior — booleans (including `false`) and the number `0` are
  // serialised as their string form. This is what the OpenAPI contract
  // expects. Don't change it without auditing every call site.
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Read an error body. The backend sends one shape for every non-2xx JSON
 * response: `{ "error": { "code", "message", "details" } }`. A 422 carries
 * `details.fields`, a list of `{ field, msg, type }`; `field` keeps its source
 * prefix (`body.title`, `query.limit`). Any other body gets the status text.
 */
export function parseErrorEnvelope(
  payload: unknown,
  fallback: string
): { message: string; fields: Record<string, string[]>; errorCode?: string } {
  const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
  if (!error) return { message: fallback, fields: {} };

  const fields: Record<string, string[]> = {};
  const details = isRecord(error.details) ? error.details : null;
  if (details && Array.isArray(details.fields)) {
    for (const item of details.fields) {
      if (isRecord(item) && typeof item.field === "string" && typeof item.msg === "string") {
        (fields[item.field] ??= []).push(item.msg);
      }
    }
  }

  return {
    message:
      typeof error.message === "string" && error.message.length > 0 ? error.message : fallback,
    fields,
    errorCode: typeof error.code === "string" ? error.code : undefined
  };
}

async function readErrorBody(response: Response): Promise<{
  message: string;
  fields: Record<string, string[]>;
  errorCode?: string;
}> {
  const fallback = response.statusText || "Request failed";
  try {
    return parseErrorEnvelope((await response.json()) as unknown, fallback);
  } catch {
    return { message: fallback, fields: {} };
  }
}

export class HttpApiClient implements ApiAdapter {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly getAccessToken?: ApiClientOptions["getAccessToken"];
  private readonly onAuthFailure?: ApiClientOptions["onAuthFailure"];
  private readonly onInactiveUser?: ApiClientOptions["onInactiveUser"];
  private readonly defaultHeaders?: HeadersInit;
  // NOTE (F10 #23): `refreshing` is per-client. In the singleton `apiClient`
  // used by the app there is only one instance, so concurrent 401s dedupe to
  // a single `onAuthFailure` call. If a consumer ever creates multiple clients
  // (e.g. in tests), each gets its own dedupe window — this is correct.
  private refreshing: Promise<string | null> | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(options.baseUrl);
    this.fetcher = options.fetcher ?? fetch.bind(window);
    this.getAccessToken = options.getAccessToken;
    this.onAuthFailure = options.onAuthFailure;
    this.onInactiveUser = options.onInactiveUser;
    this.defaultHeaders = options.defaultHeaders;
  }

  private async getAuthHeader(auth: boolean): Promise<string | null> {
    if (!auth || !this.getAccessToken) return null;
    return this.getAccessToken();
  }

  private buildHeaders(
    authHeader: string | null,
    hasBody: boolean,
    extra?: HeadersInit
  ): Headers {
    const h = new Headers(this.defaultHeaders);
    h.set("Accept", "application/json");
    if (hasBody) h.set("Content-Type", "application/json");
    if (extra) new Headers(extra).forEach((v, k) => h.set(k, v));
    if (authHeader) h.set("Authorization", `Bearer ${authHeader}`);
    return h;
  }

  private async doFetch<_TResponse, TBody>(
    req: ApiRequest<TBody>,
    token: string | null,
    deadline: Deadline
  ): Promise<Response> {
    // A FormData body goes as is: fetch sets the multipart Content-Type and boundary.
    const isForm = req.body instanceof FormData;
    const headers = this.buildHeaders(
      req.auth !== false ? token : null,
      req.body !== undefined && !isForm,
      req.headers
    );
    try {
      return await this.fetcher(buildApiUrl(this.baseUrl, req.path, req.query), {
        method: req.method ?? "GET",
        headers,
        body:
          req.body === undefined
            ? undefined
            : req.body instanceof FormData
              ? req.body
              : JSON.stringify(req.body),
        signal: deadline.signal
      });
    } catch (error) {
      throw toTransportError(error, req.signal, deadline);
    }
  }

  async request<TResponse, TBody = unknown>(
    req: ApiRequest<TBody>
  ): Promise<TResponse> {
    const { auth = true } = req;
    const method = req.method ?? "GET";
    const stopTimer = debug.timer("API", `${method} ${req.path}`);

    // NOTE (F10 #24): the `signal` on `req` is propagated to the underlying
    // `fetch`, but `getAuthHeader` (and the refresh-on-401 path below) is not
    // abortable. If a caller aborts mid-refresh, the refresh promise will
    // continue to run in the background; the next caller will see a stale
    // `refreshing` value until it resolves. Full abort support would require
    // wrapping `getAccessToken` in an abortable promise. Flag for follow-up.
    const token = await this.getAuthHeader(auth);

    // Uploads send multipart bodies, so writes get a longer budget. The
    // deadline also covers reading the body.
    const deadline = createDeadline(
      req.signal,
      req.body === undefined ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS
    );
    try {
      return await this.send<TResponse, TBody>(req, token, deadline, stopTimer);
    } finally {
      deadline.clear();
    }
  }

  private async send<TResponse, TBody>(
    req: ApiRequest<TBody>,
    token: string | null,
    deadline: Deadline,
    stopTimer: () => void
  ): Promise<TResponse> {
    const { auth = true } = req;
    const method = req.method ?? "GET";
    let response = await this.doFetch(req, token, deadline);

    // Auth-recoverable contract (verified against the FastAPI auth layer in
    // `backend/app/api/api_v1/dependencies/auth.py` + `app/core/auth.py`):
    //   - 401  = token invalid / expired / revoked / not present      -> refresh + retry
    //   - 503  = Supabase provider unreachable (transient)            -> query retry, no refresh
    //   - 403  = genuine authorization denial (USER_INACTIVE /
    //            AGENT_REQUIRED / ADMIN_REQUIRED)                      -> never refresh
    // Only 401 triggers a token refresh. Genuine 403s must surface to the
    // caller with their error_code intact, and 503s are handled by query
    // retries on the TanStack Query layer.
    const refreshHandler = auth ? this.onAuthFailure : undefined;
    const isAuthRecoverable = !!refreshHandler && response.status === 401;

    if (isAuthRecoverable) {
      debug.warn(
        "API",
        `${method} ${req.path} — ${response.status}, attempting token refresh`
      );
      if (!this.refreshing) {
        this.refreshing = refreshHandler().finally(() => {
          this.refreshing = null;
        });
      }
      const newToken = await this.refreshing;
      if (newToken) {
        debug.log("API", `${method} ${req.path} — retrying with refreshed token`);
        response = await this.doFetch(req, newToken, deadline);
      } else {
        debug.error("API", `${method} ${req.path} — token refresh failed`);
      }
    }

    if (!response.ok) {
      const retryAfterHeader = response.headers.get("Retry-After");
      // A blank header is no hint: Number("") is 0, which would retry at once.
      const retryAfter =
        retryAfterHeader === null || retryAfterHeader.trim() === ""
          ? undefined
          : Number(retryAfterHeader);
      const { message, fields, errorCode } = await readBody(
        () => readErrorBody(response),
        req.signal,
        deadline
      );
      const appError = mapStatusToAppError(
        response.status,
        message,
        fields,
        Number.isFinite(retryAfter) ? retryAfter : undefined
      );
      debug.error("API", `${method} ${req.path} — ${response.status}: ${message}`, { fields, appError });
      stopTimer();
      if (auth && response.status === 403 && errorCode === "USER_INACTIVE") this.onInactiveUser?.();
      throw new ApiClientError(appError, response.status, errorCode);
    }

    debug.log("API", `${method} ${req.path} — ${response.status}`);
    stopTimer();

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await readBody(() => response.json(), req.signal, deadline)) as TResponse;
  }
}

interface Deadline {
  signal: AbortSignal;
  timedOut: () => boolean;
  clear: () => void;
}

/**
 * Caller signal + timeout in one signal. Built from AbortController and
 * setTimeout because AbortSignal.any / AbortSignal.timeout are missing on
 * Safari < 17.4.
 */
function createDeadline(callerSignal: AbortSignal | undefined, ms: number): Deadline {
  const controller = new AbortController();
  let timedOut = false;
  const onCallerAbort = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) onCallerAbort();
  else callerSignal?.addEventListener("abort", onCallerAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, ms);
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    clear: () => {
      clearTimeout(timer);
      callerSignal?.removeEventListener("abort", onCallerAbort);
    }
  };
}

function toTransportError(
  error: unknown,
  callerSignal: AbortSignal | undefined,
  deadline: Deadline
): unknown {
  // Caller cancellation (TanStack Query unmount, etc.) must stay an AbortError.
  if (callerSignal?.aborted) return error;
  if (deadline.timedOut()) {
    return new ApiClientError({
      type: "timeout",
      message: "The server took too long to respond."
    });
  }
  return new ApiClientError({
    type: "network",
    message: "Could not reach the server."
  });
}

async function readBody<T>(
  read: () => Promise<T>,
  callerSignal: AbortSignal | undefined,
  deadline: Deadline
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (error instanceof SyntaxError) throw error;
    throw toTransportError(error, callerSignal, deadline);
  }
}

export function createApiClient(options: ApiClientOptions = {}): ApiAdapter {
  return new HttpApiClient(options);
}

