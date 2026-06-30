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
 * Minimum number of cards left in the cached deck before we trigger a fresh
 * fetch. The number is intentionally low so the user never sees an "empty
 * deck" between the optimistic removal and the network response.
 *
 * NOTE: This threshold is no longer used by `useSwipeAction` (the refill is
 * driven by SwipeDeck's `onNearEnd` callback instead), but it's retained for
 * programmatic callers that may want to check deck size independently.
 */
export const DECK_REPLENISH_THRESHOLD = 3;

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
  snapshots: Map<readonly unknown[], FlatmatesPeer[] | undefined>;
};

/**
 * Post a swipe action to the backend.
 *
 * Optimistic flow:
 *   1. `onMutate` removes the swiped profile from every cached deck under
 *      `["swipes", "deck"]`. This lets SwipeDeck's AnimatePresence start the
 *      exit animation immediately, with the next card already in place behind it.
 *   2. On error, we restore the snapshot.
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

      const snapshots = new Map<readonly unknown[], FlatmatesPeer[] | undefined>();
      const keys = getAllDeckKeys(queryClient);

      for (const key of keys) {
        const previous = queryClient.getQueryData<FlatmatesPeer[]>(key);
        if (!previous) continue;
        snapshots.set(key, previous);
        if (targetId === undefined) continue;
        const next = previous.filter((profile: FlatmatesPeer) => profile.id !== targetId);
        queryClient.setQueryData<FlatmatesPeer[]>(key, next);
      }

      return { snapshots };
    },

    onError: (_err, _payload, context) => {
      if (!context) return;
      for (const [key, snapshot] of context.snapshots) {
        queryClient.setQueryData(key, snapshot);
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
