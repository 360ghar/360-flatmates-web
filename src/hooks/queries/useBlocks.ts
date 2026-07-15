import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { CursorPage, FlatmatesPeer } from "@/lib/api/types";

/**
 * Block row from `GET /flatmates/blocks` (CursorPage envelope).
 * Wire shape: `{ id, blocked_user: FlatmatesPeer, created_at }`.
 */
export interface BlockedUser {
  id: number;
  created_at: string;
  blocked_user: FlatmatesPeer;
}

/** Convenience: blocked user id from nested peer (not a top-level field). */
export function blockedUserIdOf(block: BlockedUser): number {
  return block.blocked_user.id;
}

const BLOCKS_QUERY_KEY = ["blocks"] as const;

export function useBlockedUsers() {
  return useQuery({
    queryKey: BLOCKS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const response = await apiClient.request<CursorPage<BlockedUser>>({
        method: "GET",
        path: "/flatmates/blocks",
        signal
      });
      // Backend returns CursorPage; unwrap items for the list UI.
      return Array.isArray(response?.items) ? response.items : [];
    }
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedUserId: number) =>
      apiClient.request<{ message: string }>({
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
          previous.filter((b) => blockedUserIdOf(b) !== blockedUserId)
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
