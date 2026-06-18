# Notification

Active contributors: Saksham

A notification is a transient in-app alert: a new match, a new message, a visit update, a listing status change. Its canonical type is `FlatmatesNotification` in `src/lib/api/notification.types.ts` (re-exported from `src/lib/api/types.ts`), and the TanStack Query hooks that fetch and mutate it live in `src/hooks/queries/useNotifications.ts`. A notification crosses the notifications bell, the push layer (via Firebase Cloud Messaging), and the real-time SSE layer (which delivers new notifications live). See [push notifications](../features/push-notifications.md) and [real-time updates](../features/real-time.md).

## Shape

`FlatmatesNotification` is intentionally generic so a single shape can carry many notification kinds:

```ts
interface FlatmatesNotification {
  id: string;
  type: string;             // free-form kind, e.g. "new_match", "new_message", "visit_update"
  title: string;
  body: string;
  is_read: boolean;
  reference_id?: number | null;   // the entity the notification points at
  route?: string | null;          // the in-app route to open when tapped
  created_at?: string;
}
```

The `type` field is a free-form string rather than a closed enum because the backend can introduce new notification kinds without a client release. The `reference_id` and `route` pair let the bell deep-link the user to the right screen (a conversation, a visit detail, a listing).

## Filters

`NotificationFilters` (in `src/lib/api/notification.types.ts`) lets the list be scoped by `type`, `is_read`, and the standard `limit` and `offset` for pagination. The unread badge is typically computed client-side from the full list rather than fetched separately.

## Mutations

The notifications hooks live in `src/hooks/queries/useNotifications.ts`:

- `useNotifications(filters?)` lists notifications, optionally filtered.
- `useMarkNotificationRead()` puts to `PUT /flatmates/notifications/{id}` with a `MarkNotificationReadPayload` (`{ is_read: boolean }`).
- `useMarkAllNotificationsRead()` puts to `PUT /flatmates/notifications` with a `MarkAllNotificationsReadPayload` (`{ mark_all_read: true }`).

Both mutations invalidate the `["notifications"]` query key on success so the bell and badge refresh.

## Mapping to SSE events

Notifications are also delivered live over Server-Sent Events. The SSE event types are defined in `src/lib/sse/types.ts`. The notification-relevant events are:

| SSE event | Payload type | Maps to |
| --- | --- | --- |
| `notification` | `SSENotificationData` | A generic notification (id, type, title, description) |
| `new_match` | `SSENewMatchData` | A new match notification (match_id, optional conversation_id) |
| `new_message` | `SSENewMessageData` | A new message notification (conversation_id, message_id, sender_id) |
| `visit_update` | `SSEVisitData` | A visit status change (visit_id, property_id, status) |
| `listing_status_changed` | `SSEListingStatusChangedData` | A listing status change (property_id, change_type) |

The SSE manager in `src/lib/sse/connection.ts` parses each event and hands it to a handler that updates the relevant TanStack Query cache, so the notification list, the conversation list, and the visits list all refresh without a refetch.

## Related pages

- [Push notifications](../features/push-notifications.md) for the Firebase Cloud Messaging layer and device registration.
- [Real-time updates](../features/real-time.md) for the SSE transport, BroadcastChannel dedup, and heartbeat.

## Key source files

| File | Role |
| --- | --- |
| `src/lib/api/notification.types.ts` | `FlatmatesNotification`, `MarkNotificationReadPayload`, `MarkAllNotificationsReadPayload`, `NotificationFilters` |
| `src/lib/api/types.ts` | Re-exports notification types |
| `src/lib/sse/types.ts` | `SSEEventType`, `SSENotificationData`, `SSENewMatchData`, `SSENewMessageData`, `SSEVisitData`, `SSEListingStatusChangedData` |
| `src/hooks/queries/useNotifications.ts` | `useNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead` |
