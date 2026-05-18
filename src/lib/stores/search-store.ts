import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import type { SearchFilters, SearchType } from "@/lib/api/types";
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
  page: 1,
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
            if (state.filters[key] === value) return state;
            return { filters: { ...state.filters, [key]: value, page: 1 } };
          }),
        setFilters: (filters) =>
          set((state) => ({
            filters: { ...state.filters, ...filters, page: filters.page ?? 1 }
          })),
        setSearchType: (search_type) =>
          set((state) => ({
            filters: { ...state.filters, search_type, page: 1 }
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

