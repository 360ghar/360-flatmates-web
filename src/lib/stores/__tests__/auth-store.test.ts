import { describe, it, expect, beforeEach } from "vitest";
import { authStore } from "../auth-store";

describe("authStore", () => {
  beforeEach(() => {
    authStore.setState({
      user: null,
      session: null,
      loading: true,
    });
  });

  it("should have correct initial state", () => {
    const state = authStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.loading).toBe(true);
  });

  it("setSession updates both session and user", () => {
    const mockSession = {
      access_token: "test",
      user: { id: "u1", email: "test@test.com" },
    } as unknown as import("@supabase/supabase-js").Session;

    authStore.getState().setSession(mockSession);

    expect(authStore.getState().session).toBe(mockSession);
    expect(authStore.getState().user).toBe(mockSession.user);
  });

  it("setSession to null clears user", () => {
    authStore.getState().setSession(null);
    expect(authStore.getState().session).toBeNull();
    expect(authStore.getState().user).toBeNull();
  });

  it("setLoading updates loading state", () => {
    authStore.getState().setLoading(false);
    expect(authStore.getState().loading).toBe(false);
  });
});
