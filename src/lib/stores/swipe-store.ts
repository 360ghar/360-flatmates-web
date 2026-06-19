import { createStore } from "zustand/vanilla";
import type { FlatmatesPeer } from "@/lib/api/types";

// NOTE (F10 #18): `cardQueue` is technically server state — it originates
// from `useSwipeDeck`. It is mirrored here so non-React consumers (SSE
// handlers, animation effects) can mutate it without going through the
// React tree. The proper refactor is to derive `cardQueue` from
// `useSwipeDeck` via `useMemo` in the consumer and keep this store for
// only `currentIndex` / `isAnimating` / `direction` / `isExpanded`. Flag
// for follow-up; this pass adds the comment but does not refactor the
// ownership (cross-cutting with F4 and F6).

export interface SwipeStoreState {
  currentIndex: number;
  isAnimating: boolean;
  direction: "left" | "right" | "up" | null;
  cardQueue: FlatmatesPeer[];
  isExpanded: boolean;
  incrementIndex: () => void;
  resetIndex: () => void;
  setAnimating: (animating: boolean) => void;
  setDirection: (direction: "left" | "right" | "up") => void;
  clearDirection: () => void;
  setCardQueue: (queue: FlatmatesPeer[]) => void;
  shiftCard: () => void;
  pushCards: (cards: FlatmatesPeer[]) => void;
  toggleExpanded: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const swipeStore = createStore<SwipeStoreState>()((set) => ({
  currentIndex: 0,
  isAnimating: false,
  direction: null,
  cardQueue: [],
  isExpanded: false,

  incrementIndex: () =>
    set((state) => ({ currentIndex: state.currentIndex + 1 })),
  resetIndex: () => set({ currentIndex: 0 }),

  setAnimating: (isAnimating) =>
    set((state) => (state.isAnimating === isAnimating ? state : { isAnimating })),

  setDirection: (direction) =>
    set((state) => (state.direction === direction ? state : { direction })),
  clearDirection: () => set({ direction: null }),

  setCardQueue: (cardQueue) => set({ cardQueue, currentIndex: 0 }),
  shiftCard: () =>
    set((state) => ({
      cardQueue: state.cardQueue.slice(1),
      currentIndex: 0
    })),
  pushCards: (cards) =>
    set((state) => {
      if (cards.length === 0) return state;
      return { cardQueue: [...state.cardQueue, ...cards] };
    }),

  toggleExpanded: () =>
    set((state) => ({ isExpanded: !state.isExpanded })),
  setExpanded: (isExpanded) => set({ isExpanded })
}));
