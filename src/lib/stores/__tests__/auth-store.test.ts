import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState());
  });

  it("should have correct initial state", () => {
    const state = useAuthStore.getState();
    expect(state.isLoginModalOpen).toBe(false);
    expect(state.pendingRedirect).toBeNull();
    expect(state.authError).toBeNull();
  });

  it("openLoginModal sets isLoginModalOpen to true", () => {
    useAuthStore.getState().openLoginModal();
    expect(useAuthStore.getState().isLoginModalOpen).toBe(true);
  });

  it("closeLoginModal sets isLoginModalOpen to false", () => {
    useAuthStore.getState().openLoginModal();
    useAuthStore.getState().closeLoginModal();
    expect(useAuthStore.getState().isLoginModalOpen).toBe(false);
  });

  it("setPendingRedirect sets pendingRedirect", () => {
    useAuthStore.getState().setPendingRedirect("/dashboard");
    expect(useAuthStore.getState().pendingRedirect).toBe("/dashboard");
  });

  it("clearPendingRedirect sets pendingRedirect to null", () => {
    useAuthStore.getState().setPendingRedirect("/dashboard");
    useAuthStore.getState().clearPendingRedirect();
    expect(useAuthStore.getState().pendingRedirect).toBeNull();
  });

  it("setAuthError sets authError", () => {
    useAuthStore.getState().setAuthError("Invalid credentials");
    expect(useAuthStore.getState().authError).toBe("Invalid credentials");
  });

  it("clearAuthError sets authError to null", () => {
    useAuthStore.getState().setAuthError("Something went wrong");
    useAuthStore.getState().clearAuthError();
    expect(useAuthStore.getState().authError).toBeNull();
  });
});
