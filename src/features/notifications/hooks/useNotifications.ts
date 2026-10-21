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
  FlatmatesNotification,
  NotificationCursorPage,
  MarkNotificationReadPayload,
  MarkAllNotificationsReadPayload,
  NotificationFilters,
  NotificationsMarkedRead,
  NotificationUnreadCount
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
  const refetchInterval = useRealtimeFallbackInterval("new_notification");
  return useQuery({ ...notificationsOptions(filters), refetchInterval });
}

/**
 * Server-side unread total for the shell badge: `GET /flatmates/notifications/unread-count`
 * returns `{ unread_count }`. The list route has no unread filter, and its `total`
 * is null unless `include_total=true`, so the list cannot give this number.
 */
export function useUnreadNotificationCount() {
  const refetchInterval = useRealtimeFallbackInterval("new_notification");
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async ({ signal }) => {
      const response = await apiClient.request<NotificationUnreadCount>({
        method: "GET",
        path: "/flatmates/notifications/unread-count",
        signal
      });
      return response.unread_count;
    },
    refetchInterval
  });
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
  const refetchInterval = useRealtimeFallbackInterval("new_notification");
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
      apiClient.request<FlatmatesNotification>({
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
    mutationFn: (payload: MarkAllNotificationsReadPayload = { mark_all_read: true }) =>
      apiClient.request<NotificationsMarkedRead>({
        method: "PUT",
        path: "/flatmates/notifications",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });
}
