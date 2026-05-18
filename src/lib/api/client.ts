import { getEnv } from "@/lib/env";
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
}> {
  const fallback = response.statusText || "Request failed";

  try {
    const payload = (await response.json()) as unknown;

    if (typeof payload !== "object" || payload === null) {
      return { message: fallback, fields: {} };
    }

    const record = payload as Record<string, unknown>;
    const detail = record.detail;
    const message =
      typeof detail === "string"
        ? detail
        : typeof record.message === "string"
          ? record.message
          : fallback;

    const fields =
      typeof record.fields === "object" && record.fields !== null
        ? normalizeValidationFields(record.fields as Record<string, unknown>)
        : {};

    return { message, fields };
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
  private refreshing: Promise<string | null> | null = null;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = resolveBaseUrl(options.baseUrl);
    this.fetcher = options.fetcher ?? fetch;
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
    const token = await this.getAuthHeader(auth);

    let response = await this.doFetch(req, token);

    if (response.status === 401 && auth && this.onAuthFailure) {
      if (!this.refreshing) {
        this.refreshing = this.onAuthFailure().finally(() => {
          this.refreshing = null;
        });
      }
      const newToken = await this.refreshing;
      if (newToken) {
        response = await this.doFetch(req, newToken);
      }
    }

    if (!response.ok) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfter =
        retryAfterHeader === null ? undefined : Number(retryAfterHeader);
      const { message, fields } = await readErrorBody(response);
      const appError = mapStatusToAppError(
        response.status,
        message,
        fields,
        Number.isFinite(retryAfter) ? retryAfter : undefined
      );
      throw new ApiClientError(appError, response.status);
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    return (await response.json()) as TResponse;
  }
}

export function createApiClient(options: ApiClientOptions = {}): ApiAdapter {
  return new HttpApiClient(options);
}

