import { authSessionLifecycle } from "../session-lifecycle";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRefreshSession = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      refreshSession: mockRefreshSession,
      signOut: mockSignOut,
    },
  }),
}));

const mockSetAccessToken = vi.fn();
vi.mock("@/lib/api", () => ({
  setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args),
}));

// jsdom provides window.location; spy on assign for assertions.
const assignSpy = vi.fn();

import {
  refreshAccessToken,
  recoverDeadSession,
  _resetRefreshForTests,
} from "@/lib/auth/refresh";

describe("refresh module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetRefreshForTests();
    // signOut is best-effort + chained with .catch() in recoverDeadSession,
    // so it must return a resolved promise by default.
    mockSignOut.mockResolvedValue({ error: null });
    // Default to an app path (not /login) so recovery is allowed.
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/home",
        search: "",
        assign: assignSpy,
      },
      writable: true,
    });
  });

  describe("refreshAccessToken", () => {
    it("discards a refresh that completes after sign-out", async () => {
      let resolve!: (value: unknown) => void;
      mockRefreshSession.mockReturnValue(new Promise((done) => { resolve = done; }));
      const refresh = refreshAccessToken();
      authSessionLifecycle.beginSignOut();
      authSessionLifecycle.finishSignOut();
      resolve({ data: { session: { access_token: "stale-token" } }, error: null });
      expect(await refresh).toBeNull();
      expect(mockSetAccessToken).not.toHaveBeenCalled();
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("returns the new token and writes it via setAccessToken on success", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: { access_token: "new-token" } },
        error: null,
      });

      const token = await refreshAccessToken();

      expect(token).toBe("new-token");
      expect(mockRefreshSession).toHaveBeenCalledTimes(1);
      expect(mockSetAccessToken).toHaveBeenCalledWith("new-token");
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("dedupes N concurrent callers to a single refreshSession", async () => {
      let resolveRefresh!: (v: {
        data: { session: { access_token: string } };
        error: null;
      }) => void;
      mockRefreshSession.mockReturnValue(
        new Promise((r) => {
          resolveRefresh = r;
        })
      );

      const p1 = refreshAccessToken();
      const p2 = refreshAccessToken();
      const p3 = refreshAccessToken();

      expect(mockRefreshSession).toHaveBeenCalledTimes(1);

      resolveRefresh({
        data: { session: { access_token: "shared-token" } },
        error: null,
      });

      const [t1, t2, t3] = await Promise.all([p1, p2, p3]);
      expect(t1).toBe("shared-token");
      expect(t2).toBe("shared-token");
      expect(t3).toBe("shared-token");
      // Only one setAccessToken write even with three callers.
      expect(mockSetAccessToken).toHaveBeenCalledTimes(1);
    });

    it("serializes back-to-back calls after the mutex clears", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: { access_token: "t1" } },
        error: null,
      });

      await refreshAccessToken();
      mockRefreshSession.mockResolvedValue({
        data: { session: { access_token: "t2" } },
        error: null,
      });
      await refreshAccessToken();

      expect(mockRefreshSession).toHaveBeenCalledTimes(2);
    });

    it("recovers (signOut + /login) when refresh resolves with no session", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const token = await refreshAccessToken();

      expect(token).toBeNull();
      expect(mockSetAccessToken).not.toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(assignSpy).toHaveBeenCalledWith(
        expect.stringContaining("/login?redirect=")
      );
    });

    it("recovers when refreshSession throws a session/refresh error (reuse detection)", async () => {
      // Supabase reuse-detection error shape: session_revoked / refresh_token_not_found.
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: "Refresh token has been revoked" },
      });

      const token = await refreshAccessToken();

      expect(token).toBeNull();
      expect(mockSetAccessToken).not.toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(assignSpy).toHaveBeenCalledWith(
        expect.stringContaining("/login?redirect=")
      );
    });

    it("recovers when refreshSession rejects with a recoverable error", async () => {
      mockRefreshSession.mockRejectedValue(
        Object.assign(new Error("jwt expired"), { code: "jwt_expired" })
      );

      const token = await refreshAccessToken();

      expect(token).toBeNull();
      expect(mockSetAccessToken).not.toHaveBeenCalled();
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it("returns null WITHOUT recovery on transient errors (network)", async () => {
      const netErr = new Error("Network request failed");
      mockRefreshSession.mockRejectedValue(netErr);

      const token = await refreshAccessToken();

      expect(token).toBeNull();
      expect(mockSetAccessToken).not.toHaveBeenCalled();
      // Transient errors leave the user in place; no sign-out, no redirect.
      expect(mockSignOut).not.toHaveBeenCalled();
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("clears the mutex even on failure so the next call can retry", async () => {
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await refreshAccessToken();
      // First call recovered (signOut). A second call should run again
      // rather than hanging on a stuck mutex — but recovery is idempotent.
      mockRefreshSession.mockResolvedValue({
        data: { session: { access_token: "recovered" } },
        error: null,
      });

      const token = await refreshAccessToken();
      expect(mockRefreshSession).toHaveBeenCalledTimes(2);
      expect(token).toBe("recovered");
    });
  });

  describe("recoverDeadSession", () => {
    it("fires recovery only once across repeated calls", () => {
      recoverDeadSession();
      recoverDeadSession();
      recoverDeadSession();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(assignSpy).toHaveBeenCalledTimes(1);
    });

    it("includes the current pathname + search in the redirect target", () => {
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/settings/visits",
          search: "?tab=upcoming",
          assign: assignSpy,
        },
        writable: true,
      });

      recoverDeadSession();

      expect(assignSpy).toHaveBeenCalledWith(
        `/login?redirect=${encodeURIComponent("/settings/visits?tab=upcoming")}`
      );
    });

    it("skips recovery on auth routes to avoid a redirect loop", () => {
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/login",
          search: "",
          assign: assignSpy,
        },
        writable: true,
      });

      recoverDeadSession();

      expect(mockSignOut).not.toHaveBeenCalled();
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("skips recovery on /auth/ callback route", () => {
      Object.defineProperty(window, "location", {
        value: {
          pathname: "/auth/callback",
          search: "",
          assign: assignSpy,
        },
        writable: true,
      });

      recoverDeadSession();

      expect(mockSignOut).not.toHaveBeenCalled();
      expect(assignSpy).not.toHaveBeenCalled();
    });

    it("treats signOut failure as best-effort (does not throw)", () => {
      mockSignOut.mockRejectedValueOnce(new Error("network"));
      expect(() => recoverDeadSession()).not.toThrow();
      expect(assignSpy).toHaveBeenCalledTimes(1);
    });
  });
});
