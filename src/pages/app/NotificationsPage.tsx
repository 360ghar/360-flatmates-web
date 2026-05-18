import { useNavigate } from "react-router";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/queries";
import { notificationToNotificationCardProps } from "@/lib/api/adapters";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { NotificationCard } from "@/components/molecules/NotificationCard";

export function NotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications, isLoading, error, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = notifications ?? [];
  const hasUnread = items.some((n) => !n.is_read);

  return (
    <div className="flex flex-col gap-4 page-fade">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1">Notifications</h1>
        {hasUnread && (
          <Button
            size="compact"
            variant="tertiary"
            onClick={() => markAllRead.mutate({ mark_all_read: true })}
            loading={markAllRead.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      <AsyncView
        data={items}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={<Skeleton variant="notificationCard" count={5} />}
        empty={
          <p className="py-8 text-center text-body-md text-ink-3">
            No notifications yet. You will see matches, messages, and updates here.
          </p>
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <div className="flex flex-col gap-2">
            {data.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notificationToNotificationCardProps(notification)}
                onClick={() => {
                  if (!notification.is_read) {
                    markRead.mutate({
                      notificationId: notification.id,
                      payload: { is_read: true }
                    });
                  }
                  if (notification.route) {
                    navigate(notification.route);
                  }
                }}
              />
            ))}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
