import { useCallback, useEffect, useMemo } from "react";
import { useStore } from "zustand";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { authStore } from "@/lib/stores/auth-store";
import {
  checkIdentifierStatus as checkIdentifierStatusApi,
  reportLastMethod,
  type IdentifierStatus,
} from "@/lib/api/auth";
import { setLastAuthMethod, type AuthMethod } from "@/lib/lastAuthMethod";
import type { Session, User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Login state-machine: ask the backend whether to show password or OTP. */
  checkIdentifierStatus: (
    identifier: string,
    signal?: AbortSignal
  ) => Promise<IdentifierStatus>;
  /**
   * Send a phone OTP. `shouldCreateUser` must be `false` for login & password
   * reset (so an unknown/mistyped number cannot silently create an account) and
   * `true` only for signup.
   */
  signInWithPhone: (phone: string, shouldCreateUser?: boolean) => Promise<void>;
  /**
   * Send a 6-digit email OTP. `shouldCreateUser` must be `false` for login &
   * password reset and `true` only for signup. See {@link signInWithPhone}.
   */
  signInWithEmailOtp: (email: string, shouldCreateUser?: boolean) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  signInWithPassword: (phone: string, password: string) => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  updateUser: (password: string) => Promise<void>;
  /** Add + send OTP to a new phone for the signed-in user (Google add-phone). */
  addPhone: (phone: string) => Promise<void>;
  /** Verify the phone-change OTP for the signed-in user. */
  verifyPhoneChange: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Record a successful auth: persists the last-used method locally (masked
   * identifier hint) and reports it to the backend (best-effort). Call after
   * every successful sign-in/sign-up, including Google.
   */
  recordAuthSuccess: (method: AuthMethod, identifier?: string) => Promise<void>;
}

const TOKEN_EXPIRY_BUFFER_S = 5 * 60;

function isTokenExpired(session: Session | null): boolean {
  if (!session?.expires_at) return true;
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at - now < TOKEN_EXPIRY_BUFFER_S;
}

/**
 * Singleton initializer — runs once to bootstrap auth state and subscribe
 * to Supabase auth state changes, writing into the centralized authStore.
 */
let _initialized = false;

/** @internal — Test-only. Resets the singleton so initAuthSubscription can re-run. */
export function _resetAuthForTests() {
  _initialized = false;
  authStore.setState({
    user: null,
    session: null,
    loading: true,
    isLoginModalOpen: false,
    pendingRedirect: null,
    authError: null,
    midAuthFlow: false,
    authStage: "active",
    missingProfileFields: [],
  });
}

function initAuthSubscription() {
  if (_initialized) return;
  _initialized = true;

  const supabase = getSupabaseBrowserClient();

  // Safety timeout: force loading to false after 5s even if getSession hangs
  const timeout = setTimeout(() => {
    authStore.getState().setLoading(false);
  }, 5000);

  supabase.auth
    .getSession()
    .then(async (result: { data: { session: Session | null } }) => {
      clearTimeout(timeout);
      let currentSession = result.data.session;

      if (currentSession && isTokenExpired(currentSession)) {
        const refreshResult = await supabase.auth.refreshSession();
        currentSession = refreshResult.data.session ?? currentSession;
      }

      const testSession =
        currentSession ??
        (import.meta.env.DEV ? getPlaywrightSession() : null);

      authStore.getState().setSession(testSession);
      authStore.getState().setLoading(false);
    })
    .catch(() => {
      clearTimeout(timeout);
      authStore.getState().setLoading(false);
    });

  // Subscribe to auth state changes — single subscription for the entire app
  supabase.auth.onAuthStateChange(
    (_event: string, newSession: Session | null) => {
      const currentSession =
        newSession ?? (import.meta.env.DEV ? getPlaywrightSession() : null);
      authStore.getState().setSession(currentSession);
      authStore.getState().setLoading(false);
    }
  );
}

export function useAuth(): UseAuthReturn {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const user = useStore(authStore, (s) => s.user);
  const session = useStore(authStore, (s) => s.session);
  const loading = useStore(authStore, (s) => s.loading);

  // Ensure the singleton initializer runs on first mount
  useEffect(() => {
    initAuthSubscription();
  }, []);

  const checkIdentifierStatus = useCallback(
    (identifier: string, signal?: AbortSignal) =>
      checkIdentifierStatusApi(identifier, signal),
    []
  );

  const signInWithPhone = useCallback(
    async (phone: string, shouldCreateUser = false) => {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser },
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signInWithEmailOtp = useCallback(
    async (email: string, shouldCreateUser = false) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser },
      });
      if (error) throw error;
    },
    [supabase]
  );

  const verifyOtp = useCallback(
    async (phone: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms"
      });
      if (error) throw error;
    },
    [supabase]
  );

  const verifyEmailOtp = useCallback(
    async (email: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email"
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signInWithPassword = useCallback(
    async (phone: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        phone,
        password
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signInWithEmailPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async () => {
    const redirectTo =
      import.meta.env.VITE_AUTH_REDIRECT_URL ??
      `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) throw error;
  }, [supabase]);

  const signInWithApple = useCallback(async () => {
    const redirectTo =
      import.meta.env.VITE_AUTH_REDIRECT_URL ??
      `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo },
    });
    if (error) throw error;
  }, [supabase]);

  const updateUser = useCallback(
    async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    [supabase]
  );

  const addPhone = useCallback(
    async (phone: string) => {
      // Triggers a phone-change OTP for the currently signed-in user.
      const { error } = await supabase.auth.updateUser({ phone });
      if (error) throw error;
    },
    [supabase]
  );

  const verifyPhoneChange = useCallback(
    async (phone: string, token: string) => {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "phone_change"
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [supabase]);

  const recordAuthSuccess = useCallback(
    async (method: AuthMethod, identifier?: string) => {
      setLastAuthMethod(method, identifier);
      await reportLastMethod(method);
    },
    []
  );

  return {
    user,
    session,
    loading,
    checkIdentifierStatus,
    signInWithPhone,
    signInWithEmailOtp,
    verifyOtp,
    verifyEmailOtp,
    signInWithPassword,
    signInWithEmailPassword,
    signInWithGoogle,
    signInWithApple,
    updateUser,
    addPhone,
    verifyPhoneChange,
    signOut,
    recordAuthSuccess
  };
}

function getPlaywrightSession(): Session | null {
  if (import.meta.env.MODE === "production") return null;
  if (typeof window === "undefined") return null;
  if (window.localStorage.getItem("flatmates-playwright-auth") !== "true") return null;

  return {
    access_token: "playwright-test-token",
    refresh_token: "playwright-test-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: "test-user-id",
      app_metadata: { role: "user" },
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date(0).toISOString()
    } as User
  } as Session;
}
