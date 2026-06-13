import { createStore } from "zustand/vanilla";
import type { Session, User } from "@supabase/supabase-js";
import type { AuthStage } from "@/lib/api/auth";

export interface AuthStoreState {
  /** Supabase user object (null when signed out or still loading) */
  user: User | null;
  /** Supabase session object (null when signed out or still loading) */
  session: Session | null;
  /** True while the initial getSession() call is in progress */
  loading: boolean;

  /* ── UI-level auth state ── */
  isLoginModalOpen: boolean;
  pendingRedirect: string | null;
  authError: string | null;
  /**
   * True while a multi-step auth flow is between OTP verification and its
   * final step (mandatory set-password on login, new-password on reset).
   * The OTP verify creates a Supabase session, so without this hold
   * AuthRedirectGuard would bounce the user to /home before the flow ends.
   */
  midAuthFlow: boolean;
  /**
   * The backend-computed auth gate stage. Defaults to "active" so the
   * GateGuard does not fire until the first auth-state fetch completes.
   */
  authStage: AuthStage;
  /** Profile fields still missing (when authStage === "profile_completion"). */
  missingProfileFields: string[];

  /* ── Actions ── */
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setMidAuthFlow: (midAuthFlow: boolean) => void;
  setAuthStage: (stage: AuthStage, missingFields?: string[]) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  setPendingRedirect: (path: string) => void;
  clearPendingRedirect: () => void;
  setAuthError: (error: string) => void;
  clearAuthError: () => void;
}

export const authStore = createStore<AuthStoreState>()((set) => ({
  user: null,
  session: null,
  loading: true,

  isLoginModalOpen: false,
  pendingRedirect: null,
  authError: null,
  midAuthFlow: false,
  authStage: "active",
  missingProfileFields: [],

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
    }),

  setLoading: (loading) => set((s) => (s.loading === loading ? s : { loading })),

  setMidAuthFlow: (midAuthFlow) =>
    set((s) => (s.midAuthFlow === midAuthFlow ? s : { midAuthFlow })),

  setAuthStage: (stage, missingFields) =>
    set({
      authStage: stage,
      missingProfileFields: missingFields ?? [],
    }),

  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),

  setPendingRedirect: (path) => set({ pendingRedirect: path }),
  clearPendingRedirect: () => set({ pendingRedirect: null }),

  setAuthError: (error) => set({ authError: error }),
  clearAuthError: () => set({ authError: null }),
}));
