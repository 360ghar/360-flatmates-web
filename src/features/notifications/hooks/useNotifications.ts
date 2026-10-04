import { useRealtimeFallbackInterval } from "@/hooks/useRealtimeFallback";
import {
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  NotificationCursorPage,
  MarkNotificationReadPayload,
  MarkAllNotificationsReadPayload,
  NotificationFilters
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

const NOTIFICATIONS_PAGE_SIZE = 20;

export function notificationsOptions(filters?: NotificationFilters) {
  return queryOptions({
    queryKey: ["notifications", filters],
    queryFn: async () => {
      const response = await apiClient.request<NotificationCursorPage>({
        method: "GET",
        path: "/flatmates/notifications",
        query: (filters ?? {}) as Record<string, QueryValue>
      });
      // Defense-in-depth: the backend returns a CursorPage envelope
      // ({ items, has_more, next_cursor }). Guard against any future shape
      // drift so consumers that treat `data` as an array never crash the
      // ErrorBoundary (see RCA for the deployed `h?.filter is not a function`
      // regression caused by the cursor-envelope refactor).
      return Array.isArray(response?.items) ? response.items : [];
    }
  });
}

export function useNotifications(filters?: NotificationFilters) {
  const refetchInterval = useRealtimeFallbackInterval();
  return useQuery({ ...notificationsOptions(filters), refetchInterval });
}

/**
 * Infinite cursor-paginated notifications query.
 *
 * The backend `/flatmates/notifications` endpoint now returns a
 * `CursorPage<FlatmatesNotification>` envelope.
 */
export function useInfiniteNotifications(
  filters?: Omit<NotificationFilters, "limit" | "cursor">
) {
  const refetchInterval = useRealtimeFallbackInterval();
  return useInfiniteQuery({
    refetchInterval,
    queryKey: ["notifications", "infinite", filters],
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.request<NotificationCursorPage>({
        method: "GET",
        path: "/flatmates/notifications",
        query: {
          ...(filters ?? {}),
          cursor: pageParam,
          limit: NOTIFICATIONS_PAGE_SIZE
        } as Record<string, QueryValue>,
        signal
      });
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      notificationId,
      payload
    }: {
      notificationId: string;
      payload: MarkNotificationReadPayload;
    }) =>
      apiClient.request<{ message: string }>({
        method: "PUT",
        path: `/flatmates/notifications/${notificationId}`,
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: MarkAllNotificationsReadPayload) =>
      apiClient.request<{ message: string }>({
        method: "PUT",
        path: "/flatmates/notifications",
        body: payload ?? { mark_all_read: true }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}
