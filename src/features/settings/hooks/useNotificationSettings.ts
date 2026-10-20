import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { NotificationSettings, NotificationSettingsWrite } from "@/lib/api/types";

/** The four keys the backend stores. Any other key makes the whole PUT a 422. */
export type NotificationSettingKey = keyof NotificationSettings;

export const notificationSettingsOptions = queryOptions({
  queryKey: ["notification-settings"],
  queryFn: ({ signal }) =>
    apiClient.request<NotificationSettings>({
      method: "GET",
      path: "/users/notification-settings",
      signal
    })
});

export function useNotificationSettings() {
  return useQuery(notificationSettingsOptions);
}

/** Send only the keys that changed: the server merges them into the stored settings. */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: Partial<NotificationSettingsWrite>) =>
      apiClient.request<NotificationSettings>({
        method: "PUT",
        path: "/users/notification-settings",
        body: changes
      }),
    onSuccess: (settings) => {
      queryClient.setQueryData(notificationSettingsOptions.queryKey, settings);
    }
  });
}
