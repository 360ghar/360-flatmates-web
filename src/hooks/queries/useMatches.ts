import {
  queryOptions,
  infiniteQueryOptions,
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { IncomingLikeCursorPage, MatchCursorPage } from "@/lib/api/types";

export const MATCHES_STALE_TIME = 60_000;

export const matchesOptions = queryOptions({
  queryKey: ["matches"],
  queryFn: async ({ signal }) => {
    const response = await apiClient.request<MatchCursorPage>({
      method: "GET",
      path: "/flatmates/matches",
      signal
    });
    // Defense-in-depth against envelope shape drift (see RCA for the
    // notifications `h?.filter is not a function` regression).
    return Array.isArray(response?.items) ? response.items : [];
  },
  staleTime: MATCHES_STALE_TIME
});

export function useMatches() {
  return useQuery(matchesOptions);
}

const INCOMING_LIKES_PAGE_SIZE = 20;
const OUTGOING_LIKES_PAGE_SIZE = 20;

export function incomingLikesInfiniteOptions() {
  return infiniteQueryOptions({
    queryKey: ["incoming-likes", "infinite"],
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.request<IncomingLikeCursorPage>({
        method: "GET",
        path: "/flatmates/likes",
        query: { limit: INCOMING_LIKES_PAGE_SIZE, cursor: pageParam },
        signal
      });
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined;
    },
    staleTime: MATCHES_STALE_TIME
  });
}

export function useIncomingLikesInfinite() {
  return useInfiniteQuery(incomingLikesInfiniteOptions());
}

/**
 * Infinite outgoing likes (profiles the current user has already liked or
 * super-liked). Returns a cursor-paginated list of like history entries.
 */
export function outgoingLikesInfiniteOptions() {
  return infiniteQueryOptions({
    queryKey: ["outgoing-likes", "infinite"],
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.request<IncomingLikeCursorPage>({
        method: "GET",
        path: "/flatmates/outgoing-likes",
        query: { limit: OUTGOING_LIKES_PAGE_SIZE, cursor: pageParam },
        signal
      });
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
    staleTime: MATCHES_STALE_TIME
  });
}

export function useInfiniteOutgoingLikes() {
  return useInfiniteQuery(outgoingLikesInfiniteOptions());
}

/**
 * @deprecated Prefer `useIncomingLikesInfinite` for paginated loading.
 * Kept for back-compat with any non-paginated callers.
 */
export function incomingLikesOptions(limit = 20, cursor?: string) {
  return queryOptions({
    queryKey: ["incoming-likes", limit, cursor],
    queryFn: async ({ signal }) => {
      const response = await apiClient.request<IncomingLikeCursorPage>({
        method: "GET",
        path: "/flatmates/likes",
        query: { limit, cursor },
        signal
      });
      // Defense-in-depth against envelope shape drift (see RCA for the
      // notifications `h?.filter is not a function` regression).
      return Array.isArray(response?.items) ? response.items : [];
    },
    staleTime: MATCHES_STALE_TIME
  });
}

/**
 * @deprecated Prefer `useIncomingLikesInfinite` for paginated loading.
 */
export function useIncomingLikes(limit = 20, cursor?: string) {
  return useQuery(incomingLikesOptions(limit, cursor));
}

export function useUnmatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: number) =>
      apiClient.request<{ message: string }>({
        method: "PUT",
        path: `/flatmates/matches/${matchId}/unmatch`
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
}
