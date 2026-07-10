import { queryOptions, infiniteQueryOptions, keepPreviousData, useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  PropertySearchCursorPage,
  SearchFilters,
  WebSearchResponse,
  SavedSearch,
  SavedSearchCreate,
  SearchAlert,
  SearchAlertCreate,
  SearchAlertUpdate
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";
import {
  createSavedSearch as createSavedSearchLocal,
  createSearchAlert as createSearchAlertLocal,
  deleteSavedSearchById,
  deleteSearchAlertById,
  loadSavedSearches,
  loadSearchAlerts,
  updateSavedSearch as updateSavedSearchLocal,
  updateSearchAlert as updateSearchAlertLocal,
  type LocalSavedSearch,
  type LocalSearchAlert
} from "@/lib/storage/saved-searches";

export function webSearchOptions(filters: SearchFilters) {
  return queryOptions({
    queryKey: ["search", "web", filters],
    queryFn: async ({ signal }) => {
      const response = await apiClient.request<PropertySearchCursorPage>({
        method: "GET",
        path: "/properties",
        signal,
        query: {
          q: filters.q,
          lat: filters.lat,
          lng: filters.lng,
          radius: filters.radius,
          city: filters.city,
          locality: filters.locality,
          price_min: filters.price_min,
          price_max: filters.price_max,
          property_type: filters.property_type,
          purpose: filters.purpose,
          bedrooms_min: filters.bedrooms_min,
          bedrooms_max: filters.bedrooms_max,
          sharing_type: filters.sharing_type?.[0],
          gender_preference: filters.gender_preference?.[0],
          move_in: filters.move_in?.[0],
          available_from: filters.available_from,
          amenities: filters.amenities,
          features: filters.features,
          sort_by: filters.sort_by,
          semantic_search: filters.semantic_search,
          exclude_swiped: filters.exclude_swiped,
          limit: filters.limit,
        } as Record<string, QueryValue>,
      });

      return {
        results: response.items,
        total: response.total ?? undefined,
        next_cursor: response.next_cursor,
        has_more: response.has_more,
        limit: response.limit,
        search_type: "listings" as const,
        filters_applied: response.filters_applied,
        search_center: response.search_center,
      } satisfies WebSearchResponse;
    },
    // Keep showing prior results while the next query loads so filter
    // changes do not blank the grid (see CLAUDE.md async-state rules).
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: Object.values(filters).some(
      (value) => value !== undefined && value !== null && value !== ""
    )
  });
}

export function useWebSearch(filters: SearchFilters) {
  return useQuery(webSearchOptions(filters));
}

export function infiniteWebSearchOptions(
  filters: Omit<SearchFilters, "cursor">,
  extra?: { enabled?: boolean }
) {
  return infiniteQueryOptions({
    queryKey: ["search", "web", "infinite", filters],
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.request<PropertySearchCursorPage>({
        method: "GET",
        path: "/properties",
        signal,
        query: {
          q: filters.q,
          lat: filters.lat,
          lng: filters.lng,
          radius: filters.radius,
          city: filters.city,
          locality: filters.locality,
          price_min: filters.price_min,
          price_max: filters.price_max,
          property_type: filters.property_type,
          purpose: filters.purpose,
          bedrooms_min: filters.bedrooms_min,
          bedrooms_max: filters.bedrooms_max,
          sharing_type: filters.sharing_type?.[0],
          gender_preference: filters.gender_preference?.[0],
          move_in: filters.move_in?.[0],
          available_from: filters.available_from,
          amenities: filters.amenities,
          features: filters.features,
          sort_by: filters.sort_by,
          semantic_search: filters.semantic_search,
          exclude_swiped: filters.exclude_swiped,
          cursor: pageParam,
          limit: filters.limit ?? 20,
        } as Record<string, QueryValue>,
      });

      return {
        results: response.items,
        total: response.total ?? undefined,
        next_cursor: response.next_cursor,
        has_more: response.has_more,
        limit: response.limit,
        search_type: "listings" as const,
        filters_applied: response.filters_applied,
        search_center: response.search_center,
      } satisfies WebSearchResponse;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined;
    },
    // Keep the existing pages visible while a new filter set loads.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled:
      Object.values(filters).some(
        (value) => value !== undefined && value !== null && value !== ""
      ) && (extra?.enabled ?? true)
  });
}

export function useInfiniteWebSearch(
  filters: Omit<SearchFilters, "cursor">,
  extra?: { enabled?: boolean }
) {
  return useInfiniteQuery(infiniteWebSearchOptions(filters, extra));
}

/* -------------------------------------------------------------------------- */
/*  Saved searches (local-only)                                              */
/* -------------------------------------------------------------------------- */

/**
 * The backend does not yet expose a saved-searches endpoint, so we keep these
 * in `localStorage` to keep the Saved Searches page functional. The public API
 * shape (`SavedSearch`) is preserved so the page above does not need to know
 * the data lives client-side.
 */
function toSavedSearchShape(item: LocalSavedSearch): SavedSearch {
  return {
    id: item.id,
    user_id: item.user_id,
    name: item.name,
    filters: item.filters as SavedSearch["filters"],
    alert_enabled: item.alert_enabled,
    alert_frequency: (item.alert_frequency ?? "daily") as SavedSearch["alert_frequency"],
    alert_channels: (item.alert_channels ?? []) as SavedSearch["alert_channels"],
    last_run_at: item.last_run_at,
    new_results_count: item.new_results_count,
    created_at: item.created_at,
    updated_at: item.updated_at
  };
}

export const savedSearchesOptions = queryOptions({
  queryKey: ["search", "saved"],
  queryFn: (): SavedSearch[] => loadSavedSearches().map(toSavedSearchShape)
});

export function useSavedSearches() {
  return useQuery(savedSearchesOptions);
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SavedSearchCreate): Promise<SavedSearch> => {
      const created = createSavedSearchLocal({
        name: payload.name,
        filters: payload.filters as unknown as Record<string, unknown>,
        alert_enabled: payload.alert_enabled,
        alert_frequency: payload.alert_frequency,
        alert_channels: payload.alert_channels
      });
      return toSavedSearchShape(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "saved"] });
    }
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      deleteSavedSearchById(id);
      return { message: "Saved search deleted successfully" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "saved"] });
    }
  });
}

export function useUpdateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: { name?: string; filters?: SearchFilters; alert_enabled?: boolean } }): Promise<SavedSearch> => {
      const updated = updateSavedSearchLocal(id, {
        name: payload.name,
        filters: payload.filters as unknown as Record<string, unknown>,
        alert_enabled: payload.alert_enabled
      });
      if (!updated) {
        throw new Error("Saved search not found");
      }
      return toSavedSearchShape(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "saved"] });
    }
  });
}

/* -------------------------------------------------------------------------- */
/*  Search alerts (local-only)                                               */
/* -------------------------------------------------------------------------- */

function toSearchAlertShape(item: LocalSearchAlert): SearchAlert {
  return {
    id: item.id,
    user_id: item.user_id,
    name: item.name,
    filters: item.filters as SearchAlert["filters"],
    frequency: item.frequency as SearchAlert["frequency"],
    channels: item.channels as SearchAlert["channels"],
    enabled: item.enabled,
    last_sent_at: item.last_sent_at,
    results_sent_count: item.results_sent_count,
    created_at: item.created_at
  };
}

export const searchAlertsOptions = queryOptions({
  queryKey: ["search", "alerts"],
  queryFn: (): SearchAlert[] => loadSearchAlerts().map(toSearchAlertShape)
});

export function useSearchAlerts() {
  return useQuery(searchAlertsOptions);
}

export function useCreateSearchAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SearchAlertCreate): Promise<SearchAlert> => {
      const created = createSearchAlertLocal({
        name: payload.name,
        filters: payload.filters as unknown as Record<string, unknown>,
        frequency: payload.frequency,
        channels: payload.channels
      });
      return toSearchAlertShape(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "alerts"] });
    }
  });
}

export function useUpdateSearchAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: SearchAlertUpdate }): Promise<SearchAlert> => {
      const updated = updateSearchAlertLocal(id, {
        name: payload.name,
        filters: payload.filters as unknown as Record<string, unknown> | undefined,
        frequency: payload.frequency,
        channels: payload.channels,
        enabled: payload.enabled
      });
      if (!updated) {
        throw new Error("Search alert not found");
      }
      return toSearchAlertShape(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "alerts"] });
    }
  });
}

export function useDeleteSearchAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<{ message: string }> => {
      deleteSearchAlertById(id);
      return { message: "Search alert deleted successfully" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "alerts"] });
    }
  });
}
