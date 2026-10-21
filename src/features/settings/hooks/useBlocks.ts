import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { fetchAllPages, MAX_PAGE_LIMIT } from "@/lib/api/pagination";
import type { BlockedUser, BlockedUserCursorPage, BlockOut } from "@/lib/api/types";

export const BLOCKS_QUERY_KEY = ["blocks"] as const;

/**
 * Every row of `GET /flatmates/blocks`. A block row carries the blocked user as
 * a `PublicUserRef` (id, display name, avatar) and `blocked_user_id`. The list
 * follows `next_cursor`, so a long block list is shown whole.
 */
export function useBlockedUsers() {
  return useQuery({
    queryKey: BLOCKS_QUERY_KEY,
    queryFn: ({ signal }) =>
      fetchAllPages<BlockedUser>((cursor) =>
        apiClient.request<BlockedUserCursorPage>({
          method: "GET",
          path: "/flatmates/blocks",
          query: { cursor, limit: MAX_PAGE_LIMIT },
          signal
        })
      )
  });
}

/** `DELETE /flatmates/blocks/{blocked_user_id}` answers 204 with no body. */
export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedUserId: number) =>
      apiClient.request<void>({
        method: "DELETE",
        path: `/flatmates/blocks/${blockedUserId}`
      }),
    onMutate: async (blockedUserId) => {
      // Optimistically remove the row so the user sees instant feedback.
      await queryClient.cancelQueries({ queryKey: BLOCKS_QUERY_KEY });
      const previous =
        queryClient.getQueryData<BlockedUser[]>(BLOCKS_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<BlockedUser[]>(
          BLOCKS_QUERY_KEY,
          previous.filter((b) => b.blocked_user_id !== blockedUserId)
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(BLOCKS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKS_QUERY_KEY });
    }
  });
}

/** `POST /flatmates/blocks` answers 201 with the block row. */
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedUserId: number) =>
      apiClient.request<BlockOut>({
        method: "POST",
        path: "/flatmates/blocks",
        body: { blocked_user_id: blockedUserId }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    }
  });
}
