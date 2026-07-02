import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockUpdateUser = vi.fn();
const mockRefreshSession = vi.fn();
const mockSignInWithOAuth = vi.fn();

const mockSupabaseAuth = {
  getSession: mockGetSession,
  onAuthStateChange: mockOnAuthStateChange,
  refreshSession: mockRefreshSession,
  signInWithOtp: mockSignInWithOtp,
  verifyOtp: mockVerifyOtp,
  signInWithPassword: mockSignInWithPassword,
  signInWithOAuth: mockSignInWithOAuth,
  signOut: mockSignOut,
  updateUser: mockUpdateUser
};

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: mockSupabaseAuth
  })
}));

const mockCheckIdentifierStatus = vi.fn();
const mockReportLastMethod = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  checkIdentifierStatus: (...args: unknown[]) => mockCheckIdentifierStatus(...args),
  reportLastMethod: (...args: unknown[]) => mockReportLastMethod(...args)
}));

const mockSetLastAuthMethod = vi.fn();

vi.mock("@/lib/lastAuthMethod", () => ({
  setLastAuthMethod: (...args: unknown[]) => mockSetLastAuthMethod(...args)
}));

import { useAuth, _resetAuthForTests } from "@/hooks/useAuth";

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
    // Reset the singleton so each test gets a fresh init
    _resetAuthForTests();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
    mockSignInWithOAuth.mockResolvedValue({ error: null });
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

  it("subscribes to onAuthStateChange on first mount (singleton)", () => {
    renderHook(() => useAuth(), { wrapper: createWrapper() });
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
  });

  it("does not re-subscribe on subsequent mounts (singleton)", () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper: createWrapper() });
    unmount();
    // Second mount — singleton already initialized
    renderHook(() => useAuth(), { wrapper: createWrapper() });
    // Still only 1 call from the first init
    expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1);
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

  it("calls signInWithPhone with shouldCreateUser:false by default (login/reset safe)", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signInWithPhone("+919876543210");
    });
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      options: { shouldCreateUser: false }
    });
  });

  it("calls signInWithPhone with shouldCreateUser:true for signup", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signInWithPhone("+919876543210", true);
    });
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      options: { shouldCreateUser: true }
    });
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

  it("signInWithEmailOtp sends a 6-digit OTP with shouldCreateUser:false by default", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signInWithEmailOtp("user@example.com");
    });
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: { shouldCreateUser: false }
    });
  });

  it("signInWithEmailOtp passes shouldCreateUser:true for signup", async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signInWithEmailOtp("user@example.com", true);
    });
    expect(mockSignInWithOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      options: { shouldCreateUser: true }
    });
  });

  it("verifyEmailOtp calls verifyOtp with email and type email", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.verifyEmailOtp("user@example.com", "654321");
    });
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: "user@example.com",
      token: "654321",
      type: "email"
    });
  });

  it("signInWithEmailPassword calls signInWithPassword with email", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signInWithEmailPassword("user@example.com", "secret");
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret"
    });
  });

  it("signInWithGoogle sends Supabase the flatmates callback URL", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.signInWithGoogle("/swipe");
    });

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=%2Fswipe`
      }
    });
  });

  it("addPhone calls updateUser with phone", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.addPhone("+919876543210");
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({ phone: "+919876543210" });
  });

  it("verifyPhoneChange calls verifyOtp with type phone_change", async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.verifyPhoneChange("+919876543210", "123456");
    });
    expect(mockVerifyOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      token: "123456",
      type: "phone_change"
    });
  });

  it("checkIdentifierStatus delegates to the auth API helper", async () => {
    const status = {
      exists: true,
      verified: true,
      has_password: true,
      channel: "email",
      next_step: "password"
    };
    mockCheckIdentifierStatus.mockResolvedValue(status);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    let resolved: unknown;
    await act(async () => {
      resolved = await result.current.checkIdentifierStatus("user@example.com");
    });
    expect(mockCheckIdentifierStatus).toHaveBeenCalledWith("user@example.com", undefined);
    expect(resolved).toEqual(status);
  });

  it("recordAuthSuccess persists the method locally and reports it to the backend", async () => {
    mockReportLastMethod.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.recordAuthSuccess("phone_otp", "+919876543210");
    });
    expect(mockSetLastAuthMethod).toHaveBeenCalledWith("phone_otp", "+919876543210");
    expect(mockReportLastMethod).toHaveBeenCalledWith("phone_otp");
  });
});
