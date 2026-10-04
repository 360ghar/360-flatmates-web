export type AppError =
  | { type: "network"; message: string }
  | { type: "timeout"; message: string }
  | { type: "auth"; message: string }
  | { type: "forbidden"; message: string }
  | { type: "bad_request"; message: string }
  | { type: "server"; status: number; message: string }
  | { type: "not_found"; message: string }
  | { type: "validation"; fields: Record<string, string[]>; message: string }
  | { type: "rate_limit"; message: string; retryAfter?: number }
  | { type: "conflict"; message: string }
  | { type: "unknown"; message: string };

export class ApiClientError extends Error {
  readonly appError: AppError;
  readonly status?: number;
  readonly errorCode?: string;

  constructor(appError: AppError, status?: number, errorCode?: string) {
    super(appError.message);
    this.name = "ApiClientError";
    this.appError = appError;
    this.status = status;
    this.errorCode = errorCode;
  }
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    typeof (error as { type: unknown }).type === "string" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

export function toAppError(error: unknown): AppError {
  if (error instanceof ApiClientError) {
    return error.appError;
  }

  if (isAppError(error)) {
    return error;
  }

  if (error instanceof TypeError) {
    return { type: "network", message: "Network request failed" };
  }

  if (error instanceof Error) {
    return { type: "unknown", message: error.message };
  }

  return { type: "unknown", message: "Something went wrong" };
}

export function mapStatusToAppError(
  status: number,
  message: string,
  fields: Record<string, string[]> = {},
  retryAfter?: number
): AppError {
  if (status === 401) {
    return { type: "auth", message };
  }

  if (status === 403) {
    return { type: "forbidden", message };
  }

  if (status === 404) {
    return { type: "not_found", message };
  }

  if (status === 408) {
    return { type: "timeout", message };
  }

  if (status === 409) {
    return { type: "conflict", message };
  }

  if (status === 400) {
    return { type: "bad_request", message };
  }

  if (status === 422) {
    return { type: "validation", fields, message };
  }

  if (status === 429) {
    return { type: "rate_limit", message, retryAfter };
  }

  if (status >= 500) {
    return { type: "server", status, message };
  }

  return { type: "unknown", message };
}


const FRIENDLY_MESSAGES: Record<AppError["type"], string> = {
  network: "You seem to be offline. Check your connection and try again.",
  timeout: "The server took too long to respond. Try again.",
  auth: "Your session has ended. Sign in again.",
  forbidden: "You do not have access to this.",
  bad_request: "That request could not be completed.",
  server: "Something went wrong on our side. Try again in a moment.",
  not_found: "We could not find that.",
  validation: "Some details need fixing.",
  rate_limit: "Too many attempts. Wait a moment and try again.",
  conflict: "This changed in the meantime. Refresh and try again.",
  unknown: "Something went wrong. Try again."
};

// Backend 4xx messages for these types are written for people. Everything
// else (network text, 5xx detail, zod dumps) is replaced by a friendly line.
const SHOW_SERVER_MESSAGE = new Set<AppError["type"]>([
  "bad_request",
  "conflict",
  "validation",
  "forbidden"
]);

/** Human-readable message for any thrown value. Never returns raw stack or network text. */
export function userMessage(error: unknown, fallback?: string): string {
  const appError = toAppError(error);
  const serverText = appError.message.trim();
  if (
    SHOW_SERVER_MESSAGE.has(appError.type) &&
    serverText.length > 0 &&
    serverText.length <= 160
  ) {
    return serverText;
  }
  return fallback ?? FRIENDLY_MESSAGES[appError.type];
}
