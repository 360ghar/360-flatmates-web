import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  SwipeDeckParams,
  SwipeDeckResponse,
  SwipeRequest,
  SwipeResult,
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

export function swipeDeckOptions(filters?: SwipeDeckParams) {
  return queryOptions({
    queryKey: ["swipes", "deck", filters],
    queryFn: () =>
      apiClient.request<SwipeDeckResponse>({
        method: "GET",
        path: "/flatmates/profiles",
        query: (filters ?? {}) as Record<string, QueryValue>
      })
  });
}

export function useSwipeDeck(filters?: SwipeDeckParams) {
  return useQuery({
    ...swipeDeckOptions(filters),
    select: (data) => data.profiles
  });
}

export function useSwipeAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SwipeRequest) =>
      apiClient.request<SwipeResult>({
        method: "POST",
        path: "/flatmates/swipes",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swipes", "deck"] });
    }
  });
}
