import { createStore } from "zustand/vanilla";
import type { Session, User } from "@supabase/supabase-js";
import type { AuthStage } from "@/lib/api/auth";

export type ClientAuthStage = AuthStage | "unknown";

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
  /** Backend-computed auth gate stage, or unknown while it is being resolved. */
  authStage: ClientAuthStage;
  /** Error from the auth-stage fetch. Protected app routes fail closed on this. */
  authStageError: string | null;
  /** Profile fields still missing (when authStage === "profile_completion"). */
  missingProfileFields: string[];

  /* ── Actions ── */
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setMidAuthFlow: (midAuthFlow: boolean) => void;
  setAuthStage: (stage: AuthStage, missingFields?: string[]) => void;
  setAuthStageUnknown: () => void;
  setAuthStageError: (error: string | null) => void;
  resetAuthFlow: () => void;
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
  authStage: "unknown",
  authStageError: null,
  missingProfileFields: [],

  setSession: (session) =>
    set((state) => {
      if (!session) {
        return {
          session: null,
          user: null,
          midAuthFlow: false,
          authStage: "unknown",
          authStageError: null,
          missingProfileFields: [],
        };
      }

      const wasSignedOut = !state.user;
      return {
        session,
        user: session.user,
        ...(wasSignedOut
          ? {
              authStage: "unknown" as const,
              authStageError: null,
              missingProfileFields: [],
            }
          : {}),
      };
    }),

  setLoading: (loading) => set((s) => (s.loading === loading ? s : { loading })),

  setMidAuthFlow: (midAuthFlow) =>
    set((s) => (s.midAuthFlow === midAuthFlow ? s : { midAuthFlow })),

  setAuthStage: (stage, missingFields) =>
    set({
      authStage: stage,
      authStageError: null,
      missingProfileFields: missingFields ?? [],
    }),

  setAuthStageUnknown: () =>
    set({
      authStage: "unknown",
      authStageError: null,
      missingProfileFields: [],
    }),

  setAuthStageError: (error) =>
    set({
      authStageError: error,
      authStage: "unknown",
    }),

  resetAuthFlow: () =>
    set({
      midAuthFlow: false,
      authStage: "unknown",
      authStageError: null,
      missingProfileFields: [],
      authError: null,
      pendingRedirect: null,
      isLoginModalOpen: false,
    }),

  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),

  setPendingRedirect: (path) => set({ pendingRedirect: path }),
  clearPendingRedirect: () => set({ pendingRedirect: null }),

  setAuthError: (error) => set({ authError: error }),
  clearAuthError: () => set({ authError: null }),
}));
