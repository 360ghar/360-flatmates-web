import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  PeerCursorPage,
  SwipeDeckParams,
  SwipeRequest,
  SwipeResult,
  FlatmatesPeer
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

export function swipeDeckOptions(filters?: SwipeDeckParams) {
  return queryOptions({
    queryKey: ["swipes", "deck", filters],
    // `/flatmates/profiles` now returns a cursor page (see docs/flatmates-openapi.yaml).
    queryFn: async ({ signal }) => {
      const response = await apiClient.request<PeerCursorPage>({
        method: "GET",
        path: "/flatmates/profiles",
        query: (filters ?? {}) as Record<string, QueryValue>,
        signal
      });
      // Defense-in-depth against envelope shape drift (see RCA for the
      // notifications `h?.filter is not a function` regression).
      return Array.isArray(response?.items) ? response.items : [];
    }
  });
}

export function useSwipeDeck(filters?: SwipeDeckParams) {
  return useQuery(swipeDeckOptions(filters));
}


/**
 * Resolve the active deck query key(s) under `["swipes", "deck"]`.
 *
 * Swipe decks are keyed by their filter object (`["swipes", "deck", filters]`),
 * but a swipe may happen before the active filters are known (e.g. when the
 * caller passes no filters at all). To stay safe we optimistically update
 * every cached deck entry under the prefix, which is cheap because there is
 * typically only one active deck at a time.
 */
function getAllDeckKeys(queryClient: ReturnType<typeof useQueryClient>): readonly (readonly unknown[])[] {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ["swipes", "deck"] })
    .map((q) => q.queryKey);
}

type SwipeMutationContext = {
  /** Per deck key: the removed card and where it was, to put back on error. */
  removed: Array<{ key: readonly unknown[]; card: FlatmatesPeer; index: number }>;
};

/**
 * Post a swipe action to the backend.
 *
 * Optimistic flow:
 *   1. `onMutate` removes the swiped profile from every cached deck under
 *      `["swipes", "deck"]`. This lets SwipeDeck's AnimatePresence start the
 *      exit animation immediately, with the next card already in place behind it.
 *   2. On error, we put back only the failed card (swipes can overlap).
 *   3. On success, we do NOT invalidate the deck. The optimistic removal is
 *      the source of truth. The `onNearEnd` refill mechanism (already wired in
 *      SwipeDeck) handles fetching new pages when the deck is running low.
 *      We also skip refetching to avoid the "card stuck" bug where a per-swipe
 *      refetch raced with the exit animation and caused the index to reset or
 *      the deck to repeat stale cards.
 */
export function useSwipeAction() {
  const queryClient = useQueryClient();

  return useMutation<SwipeResult, Error, SwipeRequest, SwipeMutationContext>({
    mutationFn: (payload) =>
      apiClient.request<SwipeResult>({
        method: "POST",
        path: "/flatmates/swipes",
        body: payload
      }),

    onMutate: async (payload) => {
      // Cancel any in-flight deck refetches so they don't clobber our
      // data while the swipe animation is playing.
      await queryClient.cancelQueries({ queryKey: ["swipes", "deck"] });

      const targetId =
        payload.target_type === "user"
          ? payload.target_user_id
          : payload.property_id;

      const removed: SwipeMutationContext["removed"] = [];
      if (targetId === undefined) return { removed };

      for (const key of getAllDeckKeys(queryClient)) {
        const previous = queryClient.getQueryData<FlatmatesPeer[]>(key);
        const index = previous?.findIndex((profile) => profile.id === targetId) ?? -1;
        if (!previous || index < 0) continue;
        removed.push({ key, card: previous[index], index });
        queryClient.setQueryData<FlatmatesPeer[]>(
          key,
          previous.filter((profile) => profile.id !== targetId)
        );
      }

      return { removed };
    },

    onError: (_err, _payload, context) => {
      // Swipes can overlap, so put back only the card that failed; a whole
      // snapshot would also resurrect cards swiped since (W24).
      for (const { key, card, index } of context?.removed ?? []) {
        queryClient.setQueryData<FlatmatesPeer[]>(key, (current) => {
          if (!current || current.some((p) => p.id === card.id)) return current;
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, card);
          return next;
        });
      }
    },

    onSuccess: (result, payload) => {
      if (payload.action === "like" || payload.action === "super_like") {
        queryClient.invalidateQueries({ queryKey: ["incoming-likes"] });
        if (result.did_match) {
          queryClient.invalidateQueries({ queryKey: ["matches"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      }
    }
  });
}
