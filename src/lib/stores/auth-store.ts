import { create } from "zustand";

export interface AuthStoreState {
  isLoginModalOpen: boolean;
  pendingRedirect: string | null;
  authError: string | null;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  setPendingRedirect: (path: string) => void;
  clearPendingRedirect: () => void;
  setAuthError: (error: string) => void;
  clearAuthError: () => void;
}

export const useAuthStore = create<AuthStoreState>()((set) => ({
  isLoginModalOpen: false,
  pendingRedirect: null,
  authError: null,

  openLoginModal: () => set({ isLoginModalOpen: true }),
  closeLoginModal: () => set({ isLoginModalOpen: false }),

  setPendingRedirect: (path) => set({ pendingRedirect: path }),
  clearPendingRedirect: () => set({ pendingRedirect: null }),

  setAuthError: (error) => set({ authError: error }),
  clearAuthError: () => set({ authError: null })
}));
