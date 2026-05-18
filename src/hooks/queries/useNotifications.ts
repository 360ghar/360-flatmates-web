import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  FlatmatesNotification,
  MarkNotificationReadPayload,
  MarkAllNotificationsReadPayload,
  NotificationFilters
} from "@/lib/api/types";
import type { QueryValue } from "@/lib/api/client";

export function notificationsOptions(filters?: NotificationFilters) {
  return queryOptions({
    queryKey: ["notifications", filters],
    queryFn: () =>
      apiClient.request<FlatmatesNotification[]>({
        method: "GET",
        path: "/flatmates/notifications",
        query: (filters ?? {}) as Record<string, QueryValue>
      })
  });
}

export function useNotifications(filters?: NotificationFilters) {
  return useQuery(notificationsOptions(filters));
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
