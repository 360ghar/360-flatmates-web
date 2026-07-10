import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { createSafeJsonStorage } from "./storage";

export const UI_STORE_KEY = "360-flatmates-ui";

export type ModalId = "settings" | "photo-viewer" | "report-user" | "visit-reschedule" | "delete-confirm";
export type DrawerId = "filters" | "chat-info" | "profile-edit" | "notifications";

export type ThemePreference = "light" | "dark" | "system";
export type SidebarState = "expanded" | "collapsed";
export type RealtimeState = "disconnected" | "connecting" | "connected" | "reconnecting" | "error";

export const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const SIDEBAR_WIDTH_DEFAULT = 200;
export const SIDEBAR_WIDTH_MIN = 180;
export const SIDEBAR_WIDTH_MAX = 360;
export const SIDEBAR_WIDTH_COLLAPSED = 56;
export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  createdAt: number;
  persistent?: boolean;
}

export interface UiStoreState {
  theme: ThemePreference;
  sidebar: SidebarState;
  sidebarWidth: number;
  activeModal: ModalId | null;
  activeDrawer: DrawerId | null;
  realtimeConnected: boolean;
  realtimeState: RealtimeState;
  reducedMotion: boolean;
  toasts: ToastMessage[];
  setTheme: (theme: ThemePreference) => void;
  setSidebar: (sidebar: SidebarState) => void;
  setSidebarWidth: (width: number) => void;
  openModal: (modal: ModalId) => void;
  closeModal: () => void;
  openDrawer: (drawer: DrawerId) => void;
  closeDrawer: () => void;
  setRealtimeState: (state: RealtimeState) => void;
  setReducedMotion: (reduced: boolean) => void;
  pushToast: (toast: Omit<ToastMessage, "id" | "createdAt"> & { id?: string }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

export type UiStoreInitialState = Partial<
  Pick<
    UiStoreState,
    | "theme"
    | "sidebar"
    | "sidebarWidth"
    | "activeModal"
    | "activeDrawer"
    | "realtimeConnected"
    | "realtimeState"
    | "reducedMotion"
    | "toasts"
  >
>;

function createToastId(): string {
  return `toast-${crypto.randomUUID()}`;
}

export function createUiStore(initialState: UiStoreInitialState = {}) {
  return createStore<UiStoreState>()(
    persist(
      (set) => ({
        theme: "light",
        sidebar: "expanded",
        sidebarWidth: SIDEBAR_WIDTH_DEFAULT,
        activeModal: null,
        activeDrawer: null,
        realtimeConnected: false,
        realtimeState: "disconnected",
        reducedMotion: false,
        toasts: [],
        ...initialState,
        setTheme: (theme) => set((state) => state.theme === theme ? state : { theme }),
        setSidebar: (sidebar) => set({ sidebar }),
        setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
        openModal: (activeModal) => set({ activeModal }),
        closeModal: () => set({ activeModal: null }),
        openDrawer: (activeDrawer) => set({ activeDrawer }),
        closeDrawer: () => set({ activeDrawer: null }),
        setRealtimeState: (realtimeState) =>
          set((s) => {
            const realtimeConnected = realtimeState === "connected";
            return s.realtimeState === realtimeState &&
              s.realtimeConnected === realtimeConnected
              ? s
              : { realtimeState, realtimeConnected };
          }),
        setReducedMotion: (reducedMotion) => set({ reducedMotion }),
        pushToast: (toast) => {
          const id = toast.id ?? createToastId();
          set((state) => {
            // Keep all persistent toasts (e.g. blocking errors) and at most
            // the last 2 transient ones. Without this guard, a steady stream
            // of transient toasts would drop a persistent toast that the
            // user hasn't acknowledged yet.
            const persistent = state.toasts.filter((t) => t.persistent);
            const transient = state.toasts.filter((t) => !t.persistent).slice(-2);
            return {
              toasts: [
                ...persistent,
                ...transient,
                { ...toast, id, createdAt: Date.now() }
              ]
            };
          });
          return id;
        },
        dismissToast: (id) =>
          set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id)
          })),
        clearToasts: () => set({ toasts: [] })
      }),
      {
        name: UI_STORE_KEY,
        storage: createSafeJsonStorage(),
        partialize: (state) => ({
          theme: state.theme,
          sidebar: state.sidebar,
          sidebarWidth: state.sidebarWidth,
          reducedMotion: state.reducedMotion
        }),
        merge: (persistedState, currentState) => {
          const persisted = (persistedState ?? {}) as Partial<UiStoreState>;
          return {
            ...currentState,
            ...persisted
          };
        }
      }
    )
  );
}

export const uiStore = createUiStore();
