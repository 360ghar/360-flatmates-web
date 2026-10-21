import { createStore } from "zustand/vanilla";

// UI-only swipe state. The card deck itself is server state and lives in
// TanStack Query (`useSwipeDeck`); it is not mirrored here.

export interface SwipeStoreState {
  currentIndex: number;
  isAnimating: boolean;
  direction: "left" | "right" | "up" | null;
  isExpanded: boolean;
  incrementIndex: () => void;
  resetIndex: () => void;
  setAnimating: (animating: boolean) => void;
  setDirection: (direction: "left" | "right" | "up") => void;
  clearDirection: () => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const swipeStore = createStore<SwipeStoreState>()((set) => ({
  currentIndex: 0,
  isAnimating: false,
  direction: null,
  isExpanded: false,

  incrementIndex: () =>
    set((state) => ({ currentIndex: state.currentIndex + 1 })),
  resetIndex: () => set({ currentIndex: 0 }),

  setAnimating: (isAnimating) =>
    set((state) => (state.isAnimating === isAnimating ? state : { isAnimating })),

  setDirection: (direction) =>
    set((state) => (state.direction === direction ? state : { direction })),
  clearDirection: () => set({ direction: null }),

  toggleExpanded: () =>
    set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (isExpanded) => set({ isExpanded })
}));
