import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSession = vi.fn();
const mockRefreshAccessToken = vi.fn();
const mockConvertUploadImageToDataUrl = vi.fn();
const mockDebugError = vi.fn();
const mockFetch = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}));

vi.mock("@/lib/auth/refresh", () => ({
  refreshAccessToken: (...args: unknown[]) => mockRefreshAccessToken(...args),
}));

vi.mock("@/lib/image-utils", () => ({
  convertUploadImageToDataUrl: (...args: unknown[]) => mockConvertUploadImageToDataUrl(...args),
}));

vi.mock("@/lib/debug", () => ({
  debug: {
    error: (...args: unknown[]) => mockDebugError(...args),
  },
}));

vi.mock("@/lib/env", () => ({
  getEnv: () => ({
    VITE_API_BASE_URL: "https://api.test.com",
  }),
}));

import { useAvatarUpload } from "@/hooks/useAvatarUpload";

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeFile(type = "image/png") {
  return new File(["avatar"], "avatar.png", { type });
}

describe("useAvatarUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "stale-token" } },
    });
    mockRefreshAccessToken.mockResolvedValue("fresh-token");
    mockConvertUploadImageToDataUrl.mockRejectedValue(new Error("canvas unavailable"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("retries once on 401 and updates the cached profile image", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["profile", "me"], {
      full_name: "A User",
      profile_image_url: null,
    });

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ profile_image_url: "https://cdn.test/avatar.webp" }));

    const { result } = renderHook(() => useAvatarUpload(), {
      wrapper: createWrapper(queryClient),
    });

    let uploadedUrl = "";
    await act(async () => {
      uploadedUrl = await result.current.upload(makeFile());
    });

    expect(uploadedUrl).toBe("https://cdn.test/avatar.webp");
    expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);

    const avatarRequests = mockFetch.mock.calls.filter(
      ([input]) => typeof input === "string" && input.includes("/users/me/avatar")
    );
    expect(avatarRequests).toHaveLength(2);
    expect(new Headers(avatarRequests[0][1]?.headers).get("Authorization")).toBe("Bearer stale-token");
    expect(new Headers(avatarRequests[1][1]?.headers).get("Authorization")).toBe("Bearer fresh-token");
    expect(queryClient.getQueryData(["profile", "me"])).toMatchObject({
      profile_image_url: "https://cdn.test/avatar.webp",
    });
  });

  it("surfaces FastAPI validation arrays as a readable message", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    mockFetch
      .mockResolvedValueOnce(
        jsonResponse(
          { detail: [{ msg: "File too large" }, { msg: "Unsupported format" }] },
          422
        )
      );

    const { result } = renderHook(() => useAvatarUpload(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(result.current.upload(makeFile())).rejects.toThrow(
      "File too large, Unsupported format"
    );
  });

  it("aborts a stuck upload after the timeout", async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    mockFetch.mockImplementationOnce((_input, init) => {
      return new Promise((_resolve, reject) => {
        const signal = (init as RequestInit | undefined)?.signal;
        signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    const { result } = renderHook(() => useAvatarUpload(), {
      wrapper: createWrapper(queryClient),
    });

    const promise = result.current.upload(makeFile());
    const assertion = expect(promise).rejects.toThrow("Upload timed out. Please try again.");
    await vi.advanceTimersByTimeAsync(30_000);

    await assertion;
  });
});
