import type { FlatmatesNotification } from "@/lib/api/types";
import type { NotificationCardData, NotificationType } from "@/features/notifications/components/NotificationCard";
import { formatRelativeTime } from "@/lib/utils";

/** Map API notification type string to component NotificationType */
function mapNotificationType(apiType: string): NotificationType {
  const typeMap: Record<string, NotificationType> = {
    new_match: "new_match",
    new_message: "new_message",
    listing_approved: "listing_approved",
    listing_rejected: "listing_rejected",
    visit_scheduled: "visit_scheduled",
    visit_confirmed: "visit_confirmed"
  };
  return typeMap[apiType] ?? "general";
}

/** Map API notification to NotificationCardData for the NotificationCard component */
export function notificationToNotificationCardProps(
  notification: FlatmatesNotification
): NotificationCardData {
  return {
    id: String(notification.id),
    type: mapNotificationType(notification.type),
    title: notification.title,
    description: notification.body,
    timestamp: formatRelativeTime(notification.created_at),
    unread: !notification.is_read
  };
}
