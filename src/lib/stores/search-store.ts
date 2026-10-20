import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import type { SearchFilters } from "@/lib/api/types";
import { MOVE_IN_FILTER_VALUES, SEARCH_SORT_VALUES } from "@/lib/data";
import { readEnum } from "@/lib/api/schema";
import { createSafeJsonStorage } from "./storage";

export const SEARCH_STORE_KEY = "360-flatmates-search";

export type SearchViewMode = "grid" | "list" | "map";

export const DEFAULT_SEARCH_FILTERS = {
  radius: 5,
  property_type: ["flatmate"],
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
  const defaultValue = DEFAULT_SEARCH_FILTERS[key as keyof typeof DEFAULT_SEARCH_FILTERS];
  if (Array.isArray(defaultValue) || Array.isArray(value)) {
    return arraysEqual(
      defaultValue as readonly unknown[] | undefined,
      value as readonly unknown[] | undefined
    );
  }
  return defaultValue === value;
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

/**
 * Bring a stored filter object from before store version 3 to the current
 * shape (in place). The backend takes one value for `sharing_type`,
 * `gender_preference` and `move_in`, and does not know `search_type`,
 * `society_*` or `sub_locality`. A stored list keeps its first value, and a
 * value the backend does not know is dropped.
 */
export function upgradeLegacyFilters(filters: Record<string, unknown>): Record<string, unknown> {
  for (const key of ["sharing_type", "gender_preference", "move_in"]) {
    const value = filters[key];
    if (Array.isArray(value)) filters[key] = value[0];
  }
  // `immediately` was the old spelling of the backend's `immediate`.
  if (filters.move_in === "immediately") filters.move_in = "immediate";
  if (readEnum(MOVE_IN_FILTER_VALUES, filters.move_in) === null) delete filters.move_in;
  if (readEnum(SEARCH_SORT_VALUES, filters.sort_by) === null) delete filters.sort_by;
  for (const key of ["search_type", "society_type", "society_vibe_tags", "sub_locality"]) {
    delete filters[key];
  }
  return filters;
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
        version: 3,
        storage: createSafeJsonStorage(),
        partialize: (state) => ({
          filters: state.filters,
          recentSearches: state.recentSearches,
          viewMode: state.viewMode
        }),
        migrate: (persistedState, version) => {
          const state = persistedState as { filters?: Record<string, unknown> } | null;
          if (!state?.filters) return state ?? {};
          const filters = state.filters;
          // v1 -> v2: ensure the flatmates default property_type is present
          // so existing users with a persisted filter set still see flatmate
          // listings (not buy apartments / all property types).
          if (version < 2) {
            const types = filters.property_type;
            if (!Array.isArray(types) || types.length === 0) {
              filters.property_type = [...DEFAULT_SEARCH_FILTERS.property_type];
            }
          }
          if (version < 3) upgradeLegacyFilters(filters);
          return state;
        }
      }
    )
  );
}

export const searchStore = createSearchStore();

