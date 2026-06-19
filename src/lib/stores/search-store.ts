import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import type { SearchFilters } from "@/lib/api/types";
import type { SearchType } from "@/lib/data";
import { createSafeJsonStorage } from "./storage";

export const SEARCH_STORE_KEY = "360-flatmates-search";

export type SearchViewMode = "grid" | "list" | "map";

export const DEFAULT_SEARCH_FILTERS = {
  search_type: "listings",
  radius: 5,
  purpose: "rent",
  sort_by: "newest",
  semantic_search: false,
  exclude_swiped: false,
  limit: 20
} as const satisfies SearchFilters;

export interface SearchStoreState {
  filters: SearchFilters;
  recentSearches: string[];
  viewMode: SearchViewMode;
  setFilter: <TKey extends keyof SearchFilters>(
    key: TKey,
    value: SearchFilters[TKey]
  ) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  setSearchType: (searchType: SearchType) => void;
  resetFilters: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setViewMode: (viewMode: SearchViewMode) => void;
  getActiveFilterCount: () => number;
}

export type SearchStoreInitialState = Partial<
  Pick<SearchStoreState, "filters" | "recentSearches" | "viewMode">
>;

function isDefaultFilter(
  key: keyof SearchFilters,
  value: SearchFilters[keyof SearchFilters]
): boolean {
  return DEFAULT_SEARCH_FILTERS[key as keyof typeof DEFAULT_SEARCH_FILTERS] === value;
}

/**
 * Shallow array equality: same length and same elements in the same order.
 * Used to prevent re-renders when a new array identity arrives with the same
 * contents (e.g. from URL param parsing).
 */
function arraysEqual(a: readonly unknown[] | undefined, b: readonly unknown[] | undefined): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Deep-ish equality for SearchFilters that treats new array identities with
 * the same contents as equal. Prevents spurious re-renders when the URL is
 * the source of truth (nuqs serialises arrays fresh on every render).
 */
function filtersEqual(a: SearchFilters, b: SearchFilters): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key as keyof SearchFilters];
    const bv = b[key as keyof SearchFilters];
    if (Array.isArray(av) || Array.isArray(bv)) {
      if (!arraysEqual(av as readonly unknown[] | undefined, bv as readonly unknown[] | undefined)) {
        return false;
      }
      continue;
    }
    if (av !== bv) return false;
  }
  return true;
}

export function countActiveSearchFilters(filters: SearchFilters): number {
  return Object.entries(filters).filter(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return false;
    }

    if (Array.isArray(value) && value.length === 0) {
      return false;
    }

    return !isDefaultFilter(key as keyof SearchFilters, value);
  }).length;
}

export function createSearchStore(initialState: SearchStoreInitialState = {}) {
  return createStore<SearchStoreState>()(
    persist(
      (set, get) => ({
        filters: { ...DEFAULT_SEARCH_FILTERS },
        recentSearches: [],
        viewMode: "grid",
        ...initialState,
        setFilter: (key, value) =>
          set((state) => {
            const current = state.filters[key];
            if (Array.isArray(current) || Array.isArray(value)) {
              if (arraysEqual(current as readonly unknown[] | undefined, value as readonly unknown[] | undefined)) {
                return state;
              }
            } else if (current === value) {
              return state;
            }
            return { filters: { ...state.filters, [key]: value } };
          }),
        setFilters: (filters) =>
          set((state) => {
            const merged = { ...state.filters, ...filters };
            if (filtersEqual(state.filters, merged)) return state;
            return { filters: { ...merged } };
          }),
        setSearchType: (search_type) =>
          set((state) => ({
            filters: { ...state.filters, search_type }
          })),
        resetFilters: () => set({ filters: { ...DEFAULT_SEARCH_FILTERS } }),
        addRecentSearch: (query) => {
          const normalized = query.trim();
          if (!normalized) return;

          set((state) => {
            if (state.recentSearches[0] === normalized) return state;
            return {
              recentSearches: [
                normalized,
                ...state.recentSearches.filter((item) => item !== normalized)
              ].slice(0, 5)
            };
          });
        },
        clearRecentSearches: () => set({ recentSearches: [] }),
        setViewMode: (viewMode) => set({ viewMode }),
        getActiveFilterCount: () => countActiveSearchFilters(get().filters)
      }),
      {
        name: SEARCH_STORE_KEY,
        storage: createSafeJsonStorage(),
        partialize: (state) => ({
          filters: state.filters,
          recentSearches: state.recentSearches,
          viewMode: state.viewMode
        })
      }
    )
  );
}

export const searchStore = createSearchStore();

