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

/**
 * The backend sends one route per notification. A deep link of the flatmates
 * apps is `/flatmates/{entity}/{id}`, and the registry has two entities: `chat`
 * and `listing`. Those map to the web routes. Any other `/flatmates/` link has
 * no web page, so it gives null (the tap only marks the notice read). An app
 * route such as `/post`, `/profile` or `/chats` is kept as sent.
 */
export function notificationWebRoute(route: string | null | undefined): string | null {
  if (!route) return null;
  const deepLink = /^\/flatmates\/(chat|listing)\/(\d+)\/?$/.exec(route);
  if (deepLink) return deepLink[1] === "chat" ? `/chats/${deepLink[2]}` : `/listing/${deepLink[2]}`;
  return route === "/flatmates" || route.startsWith("/flatmates/") ? null : route;
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
