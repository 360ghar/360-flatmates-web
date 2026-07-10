import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildApiUrl, createApiClient } from "../client";
import { ApiClientError } from "../errors";

// ---------------------------------------------------------------------------
// buildApiUrl
// ---------------------------------------------------------------------------

describe("buildApiUrl", () => {
  it("appends path to base URL", () => {
    const url = buildApiUrl("https://api.test.com", "/users");
    expect(url).toBe("https://api.test.com/users");
  });

  it("normalises a path that does not start with /", () => {
    const url = buildApiUrl("https://api.test.com", "users");
    expect(url).toBe("https://api.test.com/users");
  });

  it("strips trailing slash from base URL", () => {
    const url = buildApiUrl("https://api.test.com/", "/users");
    expect(url).toBe("https://api.test.com/users");
  });

  it("serializes query params and skips undefined/null/empty values", () => {
    const url = buildApiUrl("https://api.test.com", "/items", {
      page: 2,
      q: "hello",
      active: true,
      missing: undefined,
      nil: null,
      blank: "",
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("page")).toBe("2");
    expect(parsed.searchParams.get("q")).toBe("hello");
    expect(parsed.searchParams.get("active")).toBe("true");
    expect(parsed.searchParams.has("missing")).toBe(false);
    expect(parsed.searchParams.has("nil")).toBe(false);
    expect(parsed.searchParams.has("blank")).toBe(false);
  });

  it("uses repeated keys for array query params", () => {
    const url = buildApiUrl("https://api.test.com", "/items", {
      a: [1, 2],
    });
    // URL.searchParams encodes as a=1&a=2
    const parsed = new URL(url);
    expect(parsed.searchParams.getAll("a")).toEqual(["1", "2"]);
  });

  it("returns base URL when no query params provided", () => {
    const url = buildApiUrl("https://api.test.com", "/items");
    expect(url).toBe("https://api.test.com/items");
  });
});

// ---------------------------------------------------------------------------
// HttpApiClient.request
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

function createTestClient() {
  return createApiClient({
    baseUrl: "https://api.test.com",
    getAccessToken: () => "test-token",
    fetcher: mockFetch,
  });
}

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("HttpApiClient.request", () => {
  it("sets Accept header to application/json", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    await createTestClient().request({ path: "/test" });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers as HeadersInit);
    expect(headers.get("Accept")).toBe("application/json");
  });

  it("sets Content-Type to application/json when body is present", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    await createTestClient().request({ path: "/test", method: "POST", body: { name: "test" } });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers as HeadersInit);
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("does not set Content-Type when no body is present", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    await createTestClient().request({ path: "/test", method: "GET" });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers as HeadersInit);
    expect(headers.get("Content-Type")).toBeNull();
  });

  it("sets Authorization header when auth is true and getAccessToken returns a token", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    await createTestClient().request({ path: "/test" });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers as HeadersInit);
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("skips Authorization when auth is false", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    await createTestClient().request({ path: "/test", auth: false });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers as HeadersInit);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("skips Authorization when getAccessToken returns null", async () => {
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      getAccessToken: () => null,
      fetcher: mockFetch,
    });
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    await client.request({ path: "/test" });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers as HeadersInit);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("handles 204 No Content and returns undefined", async () => {
    mockFetch.mockResolvedValue(new Response(null, { status: 204 }));
    const result = await createTestClient().request({ path: "/test" });
    expect(result).toBeUndefined();
  });

  it("parses JSON response for 200", async () => {
    const body = { id: 1, name: "Test" };
    mockFetch.mockResolvedValue(jsonResponse(body));
    const result = await createTestClient().request<{ id: number; name: string }>({ path: "/test" });
    expect(result).toEqual(body);
  });

  it("throws ApiClientError on non-ok status with detail message", async () => {
    // Use mockImplementation to return a fresh Response per call because
    // Response.json() can only be consumed once per Response object.
    mockFetch.mockImplementation(() =>
      Promise.resolve(jsonResponse({ detail: "Something went wrong" }, 500))
    );
    try {
      await createTestClient().request({ path: "/test" });
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiClientError);
      const apiError = error as ApiClientError;
      expect(apiError.status).toBe(500);
      expect(apiError.appError.type).toBe("server");
      expect(apiError.appError.message).toBe("Something went wrong");
    }
  });

  it("reads nested error.message / error.code envelope", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          {
            error: {
              code: "NOT_FOUND",
              message: "Resource not found"
            }
          },
          404
        )
      )
    );
    try {
      await createTestClient().request({ path: "/test" });
      expect.unreachable("Should have thrown");
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.status).toBe(404);
      expect(apiError.appError.type).toBe("not_found");
      expect(apiError.appError.message).toBe("Resource not found");
      expect(apiError.errorCode).toBe("NOT_FOUND");
    }
  });

  it("throws with validation fields on 422", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          { detail: "Validation error", fields: { email: ["Invalid email"], name: ["Required"] } },
          422
        )
      )
    );
    try {
      await createTestClient().request({ path: "/test" });
      expect.unreachable("Should have thrown");
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("validation");
      if (apiError.appError.type === "validation") {
        expect(apiError.appError.fields).toEqual({
          email: ["Invalid email"],
          name: ["Required"],
        });
      }
    }
  });

  it("maps 401 to auth AppError", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: "Not authenticated" }, 401)
    );
    try {
      await createTestClient().request({ path: "/test" });
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("auth");
      expect(apiError.appError.message).toBe("Not authenticated");
    }
  });

  it("maps 403 to forbidden AppError", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: "Forbidden" }, 403)
    );
    try {
      await createTestClient().request({ path: "/test" });
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("forbidden");
      expect(apiError.appError.message).toBe("Forbidden");
    }
  });

  it("maps 403 with error_code to forbidden AppError carrying errorCode", async () => {
    // A real authorization denial (not session death) must surface errorCode
    // so callers can distinguish backend-specific reasons, without triggering
    // the auth-refresh path.
    mockFetch.mockResolvedValue(
      jsonResponse(
        { code: 403, error_code: "not_owner", msg: "Not the owner" },
        403
      )
    );
    try {
      await createTestClient().request({ path: "/test" });
      expect.unreachable("Should have thrown");
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("forbidden");
      expect(apiError.errorCode).toBe("not_owner");
    }
  });

  it("does not attempt token refresh on a plain 403 (no onAuthFailure wired)", async () => {
    // createTestClient wires getAccessToken but no onAuthFailure, so a 403
    // must not even consider refreshing. This guards the new 403 branch.
    const onAuthFailure = vi.fn().mockResolvedValue("new-token");
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      getAccessToken: () => "test-token",
      onAuthFailure,
      fetcher: mockFetch,
    });
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: "Forbidden" }, 403)
    );
    try {
      await client.request({ path: "/test" });
    } catch {
      // expected
    }
    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("triggers refresh + retry on 401 (dead/expired/revoked token)", async () => {
    // Backend contract: every invalid/expired/revoked token returns 401 with
    // code TOKEN_INVALID / AUTHENTICATION_FAILED (see
    // backend/app/api/api_v1/dependencies/auth.py). This is the only
    // auth-recoverable status.
    const onAuthFailure = vi.fn().mockResolvedValue("fresh-token");
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      getAccessToken: () => "stale-token",
      onAuthFailure,
      fetcher: mockFetch,
    });
    // First call: 401 (token revoked / expired). Second call: success.
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve(
          jsonResponse(
            {
              code: "TOKEN_INVALID",
              detail: "Invalid or expired token",
            },
            401
          )
        )
      )
      .mockImplementationOnce(() =>
        Promise.resolve(jsonResponse({ data: "ok" }, 200))
      );

    const result = await client.request<{ data: string }>({ path: "/test" });

    expect(result).toEqual({ data: "ok" });
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    // The retry must carry the refreshed token.
    const retryInit = mockFetch.mock.calls[1][1] as RequestInit;
    const retryHeaders = new Headers(retryInit.headers as HeadersInit);
    expect(retryHeaders.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("propagates 401 as auth error when refresh yields no token (dead session)", async () => {
    // When refresh returns null the session is unrecoverable; the caller's
    // request is failed (the shared refresh module already initiated recovery).
    const onAuthFailure = vi.fn().mockResolvedValue(null);
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      getAccessToken: () => "stale-token",
      onAuthFailure,
      fetcher: mockFetch,
    });
    mockFetch.mockImplementation(() =>
      Promise.resolve(
        jsonResponse(
          { code: "TOKEN_INVALID", detail: "Invalid or expired token" },
          401
        )
      )
    );

    try {
      await client.request({ path: "/test" });
      expect.unreachable("Should have thrown");
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("auth");
      expect(apiError.status).toBe(401);
    }
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent 401s to a single refresh call", async () => {
    const onAuthFailure = vi.fn().mockResolvedValue("fresh-token");
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      getAccessToken: () => "stale-token",
      onAuthFailure,
      fetcher: mockFetch,
    });
    // First call 401, retry success; subsequent calls 401 with no retry.
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve(
          jsonResponse(
            { code: "TOKEN_INVALID", detail: "Invalid or expired token" },
            401
          )
        )
      )
      .mockImplementationOnce(() =>
        Promise.resolve(jsonResponse({ ok: true }, 200))
      );

    await client.request({ path: "/test" });
    expect(onAuthFailure).toHaveBeenCalledTimes(1);
  });

  it("does not refresh on a 403 even with an error_code (genuine authorization denial)", async () => {
    // Backend returns 403 only for USER_INACTIVE / AGENT_REQUIRED /
    // ADMIN_REQUIRED. These are genuine authorization denials and must
    // never trigger a token refresh — only 401 is auth-recoverable.
    const onAuthFailure = vi.fn().mockResolvedValue("fresh-token");
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      getAccessToken: () => "test-token",
      onAuthFailure,
      fetcher: mockFetch,
    });
    mockFetch.mockResolvedValue(
      jsonResponse(
        { code: "ADMIN_REQUIRED", detail: "Admin privileges required" },
        403
      )
    );
    try {
      await client.request({ path: "/test" });
      expect.unreachable("Should have thrown");
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("forbidden");
      expect(apiError.status).toBe(403);
    }
    expect(onAuthFailure).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("maps 404 to not_found AppError", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: "Not found" }, 404)
    );
    try {
      await createTestClient().request({ path: "/test" });
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("not_found");
      expect(apiError.appError.message).toBe("Not found");
    }
  });

  it("maps 429 to rate_limit AppError with retryAfter", async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ detail: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      })
    );
    try {
      await createTestClient().request({ path: "/test" });
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("rate_limit");
      if (apiError.appError.type === "rate_limit") {
        expect(apiError.appError.retryAfter).toBe(60);
      }
    }
  });

  it("maps 500 to server AppError", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: "Internal server error" }, 500)
    );
    try {
      await createTestClient().request({ path: "/test" });
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("server");
      if (apiError.appError.type === "server") {
        expect(apiError.appError.status).toBe(500);
      }
      expect(apiError.appError.message).toBe("Internal server error");
    }
  });

  it("maps unknown status codes to unknown AppError", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ detail: "I'm a teapot" }, 418)
    );
    try {
      await createTestClient().request({ path: "/test" });
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.type).toBe("unknown");
    }
  });

  it("falls back to statusText when response body is not valid JSON", async () => {
    mockFetch.mockResolvedValue(
      new Response("not json", {
        status: 500,
        statusText: "Internal Server Error",
        headers: { "Content-Type": "text/plain" },
      })
    );
    try {
      await createTestClient().request({ path: "/test" });
    } catch (error) {
      const apiError = error as ApiClientError;
      expect(apiError.appError.message).toBe("Internal Server Error");
    }
  });

  it("supports async getAccessToken", async () => {
    const client = createApiClient({
      baseUrl: "https://api.test.com",
      getAccessToken: async () => "async-token",
      fetcher: mockFetch,
    });
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    await client.request({ path: "/test" });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers as HeadersInit);
    expect(headers.get("Authorization")).toBe("Bearer async-token");
  });

  it("merges custom headers from the request", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    await createTestClient().request({
      path: "/test",
      headers: { "X-Custom": "value" },
    });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = new Headers(requestInit.headers as HeadersInit);
    expect(headers.get("X-Custom")).toBe("value");
    expect(headers.get("Accept")).toBe("application/json");
  });

  it("passes AbortSignal through to fetch", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "ok" }));
    const controller = new AbortController();
    await createTestClient().request({
      path: "/test",
      signal: controller.signal,
    });

    const requestInit = mockFetch.mock.calls[0][1] as RequestInit;
    expect(requestInit.signal).toBe(controller.signal);
  });
});
