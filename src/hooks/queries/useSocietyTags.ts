import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { SocietyTagVoteCreate } from "@/lib/api/types";

export interface SocietyTagVoteResult {
  property_id: number;
  tag: string;
  current_vote: string;
  upvotes: number;
  downvotes: number;
  disputed: boolean;
}

/**
 * Society-tags for a listing are not currently exposed as their own query,
 * so we keep an in-memory cache at ["societyTags", listingId] that consumers
 * can read via `useQueryClient` and that we refresh on every vote.
 */
export interface SocietyTagEntry {
  tag: string;
  upvotes: number;
  downvotes: number;
  my_vote?: "up" | "down" | null;
  disputed?: boolean;
}

export type SocietyTagsByListing = Record<string, SocietyTagEntry>;

export function useVoteSocietyTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listingId,
      payload
    }: {
      listingId: number;
      payload: SocietyTagVoteCreate;
    }) =>
      apiClient.request<SocietyTagVoteResult>({
        method: "POST",
        path: `/flatmates/listings/${listingId}/society-tags/votes`,
        body: payload
      }),
    onMutate: async ({ listingId, payload }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic value.
      await queryClient.cancelQueries({ queryKey: ["societyTags", listingId] });

      const previous = queryClient.getQueryData<SocietyTagsByListing>(["societyTags", listingId]);

      if (previous) {
        const existing = previous[payload.tag];
        const previousVote = existing?.my_vote ?? null;
        let upvotes = existing?.upvotes ?? 0;
        let downvotes = existing?.downvotes ?? 0;

        // Roll back the previous vote, if any.
        if (previousVote === "up") upvotes = Math.max(0, upvotes - 1);
        if (previousVote === "down") downvotes = Math.max(0, downvotes - 1);

        // Apply the new vote.
        if (payload.vote === "up") upvotes += 1;
        if (payload.vote === "down") downvotes += 1;

        const next: SocietyTagsByListing = {
          ...previous,
          [payload.tag]: {
            tag: payload.tag,
            upvotes,
            downvotes,
            my_vote: payload.vote
          }
        };

        queryClient.setQueryData<SocietyTagsByListing>(["societyTags", listingId], next);
      }

      return { previous, listingId };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["societyTags", context.listingId], context.previous);
      }
    },
    onSuccess: (result, { listingId, payload }) => {
      queryClient.setQueryData<SocietyTagsByListing>(["societyTags", listingId], (current) => {
        const existing = current?.[payload.tag];
        return {
          ...(current ?? {}),
          [payload.tag]: {
            tag: payload.tag,
            upvotes: result.upvotes,
            downvotes: result.downvotes,
            my_vote: (result.current_vote as "up" | "down" | null | undefined) ?? payload.vote,
            disputed: result.disputed ?? existing?.disputed
          }
        };
      });
    },
    onSettled: (_data, _err, { listingId }) => {
      // Re-fetch any other views that depend on the votes (e.g. listing detail).
      queryClient.invalidateQueries({ queryKey: ["properties", listingId] });
      queryClient.invalidateQueries({ queryKey: ["societyTags", listingId] });
    }
  });
}
