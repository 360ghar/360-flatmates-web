import type { Schemas } from "./schema";

export type FlatmatesNotification = Schemas["FlatmatesNotificationOut"];
export type NotificationCursorPage = Schemas["CursorPage_FlatmatesNotificationOut_"];
export type NotificationUnreadCount = Schemas["NotificationUnreadCount"];
export type NotificationsMarkedRead = Schemas["NotificationsMarkedRead"];

/** Body of `PUT /flatmates/notifications/{id}`. */
export type MarkNotificationReadPayload = Schemas["FlatmatesNotificationUpdate"];

/** Body of `PUT /flatmates/notifications`. Only `{ mark_all_read: true }` is valid. */
export type MarkAllNotificationsReadPayload = Schemas["FlatmatesNotificationBulkUpdate"];

/** Body of `PUT /users/notification-settings`: the four canonical keys. */
export type NotificationSettings = Schemas["NotificationSettings"];
export type NotificationSettingsWrite = Schemas["NotificationSettingsWrite"];

/** `GET /flatmates/notifications` declares `cursor`, `limit` and `include_total` only. */
export interface NotificationFilters {
  limit?: number;
  cursor?: string;
}
