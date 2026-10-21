import { describe, expect, it } from "vitest";
import { ApiClientError, mapStatusToAppError } from "../errors";
import { MAX_AUTO_RETRY_WAIT_S, queryRetryDelay, retryAfterSeconds, withinAutoRetryWait } from "../retry";

function apiError(status: number, retryAfter?: number) {
  return new ApiClientError(mapStatusToAppError(status, "failed", {}, retryAfter), status);
}

describe("Retry-After on 429 and 503", () => {
  it("keeps the header value on a 503 as well as a 429", () => {
    expect(retryAfterSeconds(apiError(503, 5))).toBe(5);
    expect(retryAfterSeconds(apiError(429, 60))).toBe(60);
    expect(retryAfterSeconds(apiError(500))).toBeUndefined();
    expect(retryAfterSeconds(new Error("boom"))).toBeUndefined();
  });

  it("waits the server's time, else the default backoff", () => {
    expect(queryRetryDelay(0, apiError(503, 5))).toBe(5_000);
    expect(queryRetryDelay(0, apiError(500))).toBe(1_000);
    expect(queryRetryDelay(3, apiError(500))).toBe(8_000);
    expect(queryRetryDelay(10, apiError(500))).toBe(30_000);
  });

  it("does not retry on its own when the wait is long", () => {
    expect(withinAutoRetryWait(apiError(429, MAX_AUTO_RETRY_WAIT_S))).toBe(true);
    expect(withinAutoRetryWait(apiError(429, MAX_AUTO_RETRY_WAIT_S + 1))).toBe(false);
    expect(withinAutoRetryWait(apiError(500))).toBe(true);
  });
});
