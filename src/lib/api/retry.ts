import { ApiClientError } from "./errors";

/** Longest wait a query sits out on its own. A longer `Retry-After` is left to the user. */
export const MAX_AUTO_RETRY_WAIT_S = 15;

/** Seconds from a 429 or 503 `Retry-After` header, when the response carried one. */
export function retryAfterSeconds(error: unknown): number | undefined {
  if (!(error instanceof ApiClientError)) return undefined;
  const { appError } = error;
  return appError.type === "rate_limit" || appError.type === "server" ? appError.retryAfter : undefined;
}

/** Retry delay in ms: the server's `Retry-After` when it sent one, else the TanStack default backoff. */
export function queryRetryDelay(failureCount: number, error: unknown): number {
  const wait = retryAfterSeconds(error);
  return wait === undefined ? Math.min(1000 * 2 ** failureCount, 30_000) : wait * 1000;
}

/** False when the server asked for a wait too long to hide behind a spinner. */
export function withinAutoRetryWait(error: unknown): boolean {
  const wait = retryAfterSeconds(error);
  return wait === undefined || wait <= MAX_AUTO_RETRY_WAIT_S;
}
