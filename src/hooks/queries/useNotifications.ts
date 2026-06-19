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
      return response.items;
    }
  });
}

export function useNotifications(filters?: NotificationFilters) {
  return useQuery(notificationsOptions(filters));
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
  return useInfiniteQuery({
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
