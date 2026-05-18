import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();

const mockSupabaseAuth = {
  getSession: mockGetSession,
  onAuthStateChange: mockOnAuthStateChange,
  signInWithOtp: mockSignInWithOtp,
  verifyOtp: mockVerifyOtp,
  signInWithPassword: mockSignInWithPassword,
  signUp: mockSignUp,
  signOut: mockSignOut
};

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: mockSupabaseAuth
  })
}));

import { useAuth } from "@/hooks/useAuth";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  it("starts in loading state", () => {
    mockGetSession.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    expect(result.current.loading).toBe(true);
  });

  it("calls getSession on mount and resolves loading", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(mockGetSession).toHaveBeenCalledTimes(1);
  });

  it("subscribes to onAuthStateChange on mount", () => {
    renderHook(() => useAuth(), { wrapper: createWrapper() });
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes from onAuthStateChange on unmount", () => {
    const mockUnsubscribe = vi.fn();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    });
    const { unmount } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("sets user and session when getSession returns a session", async () => {
    const mockUser = { id: "user-1" };
    const mockSession = { user: mockUser, access_token: "token", expires_at: Math.floor(Date.now() / 1000) + 3600 };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });

  it("calls signInWithPhone and throws on error", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signInWithPhone("+919876543210");
    });
    expect(mockSignInWithOtp).toHaveBeenCalledWith({ phone: "+919876543210" });
  });

  it("signInWithPhone re-throws Supabase error", async () => {
    const error = new Error("OTP failed");
    mockSignInWithOtp.mockResolvedValue({ error });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.signInWithPhone("+919876543210");
      })
    ).rejects.toThrow("OTP failed");
  });

  it("calls verifyOtp with phone, token, and type sms", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.verifyOtp("+919876543210", "123456");
    });
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      token: "123456",
      type: "sms"
    });
  });

  it("calls signInWithPassword with phone and password", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signInWithPassword("+919876543210", "secret");
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      phone: "+919876543210",
      password: "secret"
    });
  });

  it("calls signUp with phone and password", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signUp("+919876543210", "secret");
    });
    expect(mockSignUp).toHaveBeenCalledWith({
      phone: "+919876543210",
      password: "secret"
    });
  });

  it("calls signOut and throws on error", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signOut();
    });
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("signOut re-throws Supabase error", async () => {
    const error = new Error("Sign out failed");
    mockSignOut.mockResolvedValue({ error });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await expect(
      act(async () => {
        await result.current.signOut();
      })
    ).rejects.toThrow("Sign out failed");
  });
});
