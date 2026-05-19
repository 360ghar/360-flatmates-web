export interface FlatmatesNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  reference_id?: number | null;
  route?: string | null;
  created_at?: string;
}

export interface MarkNotificationReadPayload {
  is_read: boolean;
}

export interface MarkAllNotificationsReadPayload {
  mark_all_read: boolean;
}

export interface NotificationFilters {
  type?: string;
  is_read?: boolean;
  limit?: number;
  offset?: number;
}
