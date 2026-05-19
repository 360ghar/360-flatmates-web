import { queryOptions, infiniteQueryOptions, useMutation, useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  PaginatedPropertyResponse,
  SearchFilters,
  WebSearchResponse,
  SavedSearch,
  SavedSearchCreate,
  SearchAlert,
  SearchAlertCreate
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

export function webSearchOptions(filters: SearchFilters) {
  return queryOptions({
    queryKey: ["search", "web", filters],
    queryFn: async () => {
      const response = await apiClient.request<PaginatedPropertyResponse>({
        method: "GET",
        path: "/properties",
        auth: false,
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
          page: filters.page,
          limit: filters.limit,
        } as Record<string, QueryValue>,
      });

      return {
        results: response.properties,
        total: response.total,
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages,
        search_type: "listings" as const,
        filters_applied: response.filters_applied,
        search_center: response.search_center,
      } satisfies WebSearchResponse;
    },
    enabled: Object.values(filters).some(
      (value) => value !== undefined && value !== null && value !== ""
    )
  });
}

export function useWebSearch(filters: SearchFilters) {
  return useQuery(webSearchOptions(filters));
}

export function infiniteWebSearchOptions(filters: Omit<SearchFilters, "page">) {
  return infiniteQueryOptions({
    queryKey: ["search", "web", "infinite", filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.request<PaginatedPropertyResponse>({
        method: "GET",
        path: "/properties",
        auth: false,
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
          page: pageParam,
          limit: filters.limit ?? 20,
        } as Record<string, QueryValue>,
      });

      return {
        results: response.properties,
        total: response.total,
        page: response.page,
        limit: response.limit,
        total_pages: response.total_pages,
        search_type: "listings" as const,
        filters_applied: response.filters_applied,
        search_center: response.search_center,
      } satisfies WebSearchResponse;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: Object.values(filters).some(
      (value) => value !== undefined && value !== null && value !== ""
    )
  });
}

export function useInfiniteWebSearch(filters: Omit<SearchFilters, "page">) {
  return useInfiniteQuery(infiniteWebSearchOptions(filters));
}

export const savedSearchesOptions = queryOptions({
  queryKey: ["search", "saved"],
  queryFn: () =>
    apiClient.request<SavedSearch[]>({
      method: "GET",
      path: "/flatmates/web/saved-searches"
    })
});

export function useSavedSearches() {
  return useQuery(savedSearchesOptions);
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SavedSearchCreate) =>
      apiClient.request<SavedSearch>({
        method: "POST",
        path: "/flatmates/web/saved-searches",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "saved"] });
    }
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiClient.request<{ message: string }>({
        method: "DELETE",
        path: `/flatmates/web/saved-searches/${id}`
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "saved"] });
    }
  });
}

export const searchAlertsOptions = queryOptions({
  queryKey: ["search", "alerts"],
  queryFn: () =>
    apiClient.request<SearchAlert[]>({
      method: "GET",
      path: "/flatmates/web/alerts"
    })
});

export function useSearchAlerts() {
  return useQuery(searchAlertsOptions);
}

export function useCreateSearchAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SearchAlertCreate) =>
      apiClient.request<SearchAlert>({
        method: "POST",
        path: "/flatmates/web/alerts",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "alerts"] });
    }
  });
}
