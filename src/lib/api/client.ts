import { getEnv } from "@/lib/env";
import { debug } from "@/lib/debug";
import { ApiClientError, mapStatusToAppError } from "./errors";

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

async function readErrorBody(response: Response): Promise<{
  message: string;
  fields: Record<string, string[]>;
  errorCode?: string;
}> {
  const fallback = response.statusText || "Request failed";

  try {
    const payload = (await response.json()) as unknown;

    if (typeof payload !== "object" || payload === null) {
      return { message: fallback, fields: {} };
    }

    const record = payload as Record<string, unknown>;
    // Backend standardized envelope: `{ error: { code, message, details? } }`.
    const nestedError =
      typeof record.error === "object" && record.error !== null
        ? (record.error as Record<string, unknown>)
        : null;
    const detail = record.detail;
    const message =
      nestedError && typeof nestedError.message === "string"
        ? nestedError.message
        : typeof detail === "string"
          ? detail
          : typeof record.message === "string"
            ? record.message
            : fallback;

    const fields =
      typeof record.fields === "object" && record.fields !== null
        ? normalizeValidationFields(record.fields as Record<string, unknown>)
        : nestedError &&
            typeof nestedError.details === "object" &&
            nestedError.details !== null &&
            "fields" in (nestedError.details as Record<string, unknown>)
          ? normalizeValidationFields(
              (nestedError.details as { fields: Record<string, unknown> }).fields
            )
          : {};

    const errorCode =
      nestedError && typeof nestedError.code === "string"
        ? nestedError.code
        : typeof record.error_code === "string"
          ? record.error_code
          : undefined;

    return { message, fields, errorCode };
  } catch {
    return { message: fallback, fields: {} };
  }
}

function normalizeValidationFields(
  fields: Record<string, unknown>
): Record<string, string[]> {
  const normalized: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      normalized[key] = value.map(String);
    } else if (value !== undefined && value !== null) {
      normalized[key] = [String(value)];
    }
  }

  return normalized;
}

export class HttpApiClient implements ApiAdapter {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly getAccessToken?: ApiClientOptions["getAccessToken"];
  private readonly onAuthFailure?: ApiClientOptions["onAuthFailure"];
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
    token: string | null
  ): Promise<Response> {
    const headers = this.buildHeaders(
      req.auth !== false ? token : null,
      req.body !== undefined,
      req.headers
    );
    return this.fetcher(buildApiUrl(this.baseUrl, req.path, req.query), {
      method: req.method ?? "GET",
      headers,
      body: req.body === undefined ? undefined : JSON.stringify(req.body),
      signal: req.signal
    });
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

    let response = await this.doFetch(req, token);

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
        response = await this.doFetch(req, newToken);
      } else {
        debug.error("API", `${method} ${req.path} — token refresh failed`);
      }
    }

    if (!response.ok) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfter =
        retryAfterHeader === null ? undefined : Number(retryAfterHeader);
      const { message, fields, errorCode } = await readErrorBody(response);
      const appError = mapStatusToAppError(
        response.status,
        message,
        fields,
        Number.isFinite(retryAfter) ? retryAfter : undefined
      );
      debug.error("API", `${method} ${req.path} — ${response.status}: ${message}`, { fields, appError });
      stopTimer();
      throw new ApiClientError(appError, response.status, errorCode);
    }

    debug.log("API", `${method} ${req.path} — ${response.status}`);
    stopTimer();

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }
}

export function createApiClient(options: ApiClientOptions = {}): ApiAdapter {
  return new HttpApiClient(options);
}

