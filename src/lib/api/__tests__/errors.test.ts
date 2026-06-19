import { describe, it, expect } from "vitest";
import { ApiClientError, mapStatusToAppError, isAppError, toAppError } from "../errors";
import type { AppError } from "../errors";

// ---------------------------------------------------------------------------
// ApiClientError
// ---------------------------------------------------------------------------

describe("ApiClientError", () => {
  it("constructs with appError and status", () => {
    const appError: AppError = { type: "auth", message: "Unauthorized" };
    const error = new ApiClientError(appError, 401);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error.name).toBe("ApiClientError");
    expect(error.message).toBe("Unauthorized");
    expect(error.appError).toBe(appError);
    expect(error.status).toBe(401);
  });

  it("constructs without status", () => {
    const appError: AppError = { type: "network", message: "Failed" };
    const error = new ApiClientError(appError);

    expect(error.status).toBeUndefined();
    expect(error.appError).toBe(appError);
  });

  it("carries validation fields on the appError", () => {
    const appError: AppError = {
      type: "validation",
      message: "Validation failed",
      fields: { email: ["Invalid format"], name: ["Required"] },
    };
    const error = new ApiClientError(appError, 422);

    expect(error.appError.type).toBe("validation");
    if (error.appError.type === "validation") {
      expect(error.appError.fields).toEqual({
        email: ["Invalid format"],
        name: ["Required"],
      });
    }
  });

  it("carries retryAfter on rate_limit appError", () => {
    const appError: AppError = {
      type: "rate_limit",
      message: "Slow down",
      retryAfter: 30,
    };
    const error = new ApiClientError(appError, 429);

    expect(error.appError.type).toBe("rate_limit");
    if (error.appError.type === "rate_limit") {
      expect(error.appError.retryAfter).toBe(30);
    }
  });
});

// ---------------------------------------------------------------------------
// mapStatusToAppError
// ---------------------------------------------------------------------------

describe("mapStatusToAppError", () => {
  it("maps 401 to auth", () => {
    const result = mapStatusToAppError(401, "Unauthorized");
    expect(result).toEqual({ type: "auth", message: "Unauthorized" });
  });

  it("maps 403 to forbidden", () => {
    const result = mapStatusToAppError(403, "Forbidden");
    expect(result).toEqual({ type: "forbidden", message: "Forbidden" });
  });

  it("maps 408 to timeout", () => {
    const result = mapStatusToAppError(408, "Request timeout");
    expect(result).toEqual({ type: "timeout", message: "Request timeout" });
  });

  it("maps 404 to not_found", () => {
    const result = mapStatusToAppError(404, "Resource not found");
    expect(result).toEqual({ type: "not_found", message: "Resource not found" });
  });

  it("maps 409 to conflict", () => {
    const result = mapStatusToAppError(409, "Duplicate entry");
    expect(result).toEqual({ type: "conflict", message: "Duplicate entry" });
  });

  it("maps 422 to validation with fields", () => {
    const fields = { email: ["Invalid"] };
    const result = mapStatusToAppError(422, "Validation error", fields);
    expect(result).toEqual({
      type: "validation",
      fields,
      message: "Validation error",
    });
  });

  it("maps 400 to bad_request", () => {
    const result = mapStatusToAppError(400, "Bad request");
    expect(result).toEqual({
      type: "bad_request",
      message: "Bad request",
    });
  });

  it("maps 429 to rate_limit with retryAfter", () => {
    const result = mapStatusToAppError(429, "Too many requests", {}, 60);
    expect(result).toEqual({
      type: "rate_limit",
      message: "Too many requests",
      retryAfter: 60,
    });
  });

  it("maps 429 to rate_limit without retryAfter when omitted", () => {
    const result = mapStatusToAppError(429, "Too many requests");
    expect(result).toEqual({
      type: "rate_limit",
      message: "Too many requests",
      retryAfter: undefined,
    });
  });

  it("maps 500 to server", () => {
    const result = mapStatusToAppError(500, "Internal server error");
    expect(result).toEqual({
      type: "server",
      status: 500,
      message: "Internal server error",
    });
  });

  it("maps 502 to server", () => {
    const result = mapStatusToAppError(502, "Bad gateway");
    expect(result).toEqual({
      type: "server",
      status: 502,
      message: "Bad gateway",
    });
  });

  it("maps 503 to server", () => {
    const result = mapStatusToAppError(503, "Service unavailable");
    expect(result).toEqual({
      type: "server",
      status: 503,
      message: "Service unavailable",
    });
  });

  it("maps unrecognised status codes to unknown", () => {
    const result = mapStatusToAppError(418, "I'm a teapot");
    expect(result).toEqual({ type: "unknown", message: "I'm a teapot" });
  });
});

// ---------------------------------------------------------------------------
// isAppError
// ---------------------------------------------------------------------------

describe("isAppError", () => {
  it("returns true for a valid AppError", () => {
    const error: AppError = { type: "auth", message: "No" };
    expect(isAppError(error)).toBe(true);
  });

  it("returns false for null", () => {
    expect(isAppError(null)).toBe(false);
  });

  it("returns false for a plain string", () => {
    expect(isAppError("not an error")).toBe(false);
  });

  it("returns false for an object missing message", () => {
    expect(isAppError({ type: "auth" })).toBe(false);
  });

  it("returns false for an object missing type", () => {
    expect(isAppError({ message: "auth" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// toAppError
// ---------------------------------------------------------------------------

describe("toAppError", () => {
  it("extracts appError from ApiClientError", () => {
    const appError: AppError = { type: "auth", message: "Unauthorized" };
    const error = new ApiClientError(appError, 401);
    expect(toAppError(error)).toBe(appError);
  });

  it("returns a valid AppError as-is", () => {
    const appError: AppError = { type: "not_found", message: "Gone" };
    expect(toAppError(appError)).toBe(appError);
  });

  it("maps TypeError to network error", () => {
    const result = toAppError(new TypeError("fetch failed"));
    expect(result).toEqual({ type: "network", message: "Network request failed" });
  });

  it("maps generic Error to unknown", () => {
    const result = toAppError(new Error("something broke"));
    expect(result).toEqual({ type: "unknown", message: "something broke" });
  });

  it("maps non-Error values to unknown with default message", () => {
    expect(toAppError("string")).toEqual({
      type: "unknown",
      message: "Something went wrong",
    });
  });

  it("maps null to unknown with default message", () => {
    expect(toAppError(null)).toEqual({
      type: "unknown",
      message: "Something went wrong",
    });
  });
});
