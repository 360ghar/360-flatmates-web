import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  BatchDeleteMediaRequest,
  BatchDeleteMediaResponse,
  BatchRemoveSwipesRequest,
  BatchRemoveSwipesResponse,
  MessageResponse
} from "@/lib/api/types";

/**
 * Remove multiple swipes in a single round trip. Returns the number of
 * successfully removed property ids; the backend also surfaces which ids
 * could not be removed (e.g. they had been already auto-purged by the
 * retention job).
 */
export function useBatchRemoveSwipes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchRemoveSwipesRequest) =>
      apiClient.request<BatchRemoveSwipesResponse>({
        method: "POST",
        path: "/swipes/batch-remove",
        body: payload
      }),
    onSuccess: (_data, variables) => {
      // Optimistically drop the swiped-out properties from any deck cache.
      queryClient.setQueriesData<unknown>(
        { queryKey: ["swipes", "deck"] },
        (old) => {
          if (!Array.isArray(old)) return old;
          const removed = new Set(variables.property_ids);
          return old.filter((entry) => {
            if (entry && typeof entry === "object" && "id" in entry) {
              return !removed.has((entry as { id: number }).id);
            }
            return true;
          });
        }
      );
      queryClient.invalidateQueries({ queryKey: ["swipes", "deck"] });
      queryClient.invalidateQueries({ queryKey: ["outgoing-likes"] });
    }
  });
}

/**
 * Delete a batch of media items by their cloudinary public ids. The backend
 * returns the list of deleted ids and the list of failed ids (with reasons)
 * so the caller can surface granular success/error toasts.
 */
export function useBatchDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BatchDeleteMediaRequest) =>
      apiClient.request<BatchDeleteMediaResponse>({
        method: "POST",
        path: "/upload/media/batch-delete",
        body: payload
      }),
    onSuccess: () => {
      // Any media gallery query key is invalidated. Components can show a
      // per-row error for entries in `failed`.
      queryClient.invalidateQueries({ queryKey: ["media"] });
    }
  });
}

// Avoid unused import warning for MessageResponse when consumed via the
// type-only re-export.
export type { MessageResponse };
