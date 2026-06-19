import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { FlatmatesPeer } from "@/lib/api/types";

export interface BlockedUser {
  id: number;
  blocker_user_id: number;
  blocked_user_id: number;
  created_at: string;
  blocked_user: FlatmatesPeer;
}

const BLOCKS_QUERY_KEY = ["blocks"] as const;

export function useBlockedUsers() {
  return useQuery({
    queryKey: BLOCKS_QUERY_KEY,
    queryFn: () =>
      apiClient.request<BlockedUser[]>({
        method: "GET",
        path: "/flatmates/blocks"
      })
  });
}

/**
 * Block a user. The wire is not yet finalised by the backend (see B-1), but
 * this hook centralises the path, body, and cache invalidation that callers
 * (e.g. ChatDetailPage) were inlining. When the backend contract is confirmed,
 * update only the path/body here.
 */
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockedUserId: number) =>
      apiClient.request<{ message?: string }>({
        method: "POST",
        path: "/flatmates/blocks",
        body: { blocked_user_id: blockedUserId }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOCKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
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
