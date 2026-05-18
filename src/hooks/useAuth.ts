import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  signInWithPassword: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUser: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const TOKEN_EXPIRY_BUFFER_S = 5 * 60;

function isTokenExpired(session: Session | null): boolean {
  if (!session?.expires_at) return true;
  const now = Math.floor(Date.now() / 1000);
  return session.expires_at - now < TOKEN_EXPIRY_BUFFER_S;
}

export function useAuth(): UseAuthReturn {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout: force loading to false after 5s even if getSession hangs
    const timeout = setTimeout(() => {
      setLoading(false);
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

        const testSession = currentSession ?? (import.meta.env.DEV ? getPlaywrightSession() : null);
        setSession(testSession);
        setUser(testSession?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    // Subscribe to auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        const currentSession = newSession ?? (import.meta.env.DEV ? getPlaywrightSession() : null);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signInWithPhone = useCallback(
    async (phone: string) => {
      const { error } = await supabase.auth.signInWithOtp({ phone });
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

  const signUp = useCallback(
    async (phone: string, password: string) => {
      const { error } = await supabase.auth.signUp({
        phone,
        password
      });
      if (error) throw error;
    },
    [supabase]
  );

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
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

  const resetPassword = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [supabase]);

  return {
    user,
    session,
    loading,
    signInWithPhone,
    verifyOtp,
    signInWithPassword,
    signUp,
    signInWithGoogle,
    updateUser,
    resetPassword,
    signOut
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
