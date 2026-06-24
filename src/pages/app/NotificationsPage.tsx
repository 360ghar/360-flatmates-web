import { useNavigate } from "react-router";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/queries";
import { notificationToNotificationCardProps } from "@/lib/api/adapters";
import { formatRelativeTime } from "@/lib/utils";
import { resolveRedirect } from "@/lib/redirect";
import { uiStore } from "@/lib/stores/ui-store";
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
            onClick={() =>
              markAllRead.mutate(
                { mark_all_read: true },
                {
                  onError: () => {
                    uiStore.getState().pushToast({
                      type: "error",
                      title: "Could not mark all as read",
                      description: "Please try again."
                    });
                  }
                }
              )
            }
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
          <div className="flex flex-col gap-2" role="list" aria-label="Notifications">
            {data.map((notification) => {
              const cardProps = notificationToNotificationCardProps(notification);
              return (
                <NotificationCard
                  key={notification.id}
                  role="listitem"
                  notification={{
                    ...cardProps,
                    timestamp: formatRelativeTime(notification.created_at)
                  }}
                  interactive
                  onClick={() => {
                    if (!notification.is_read) {
                      markRead.mutate({
                        notificationId: notification.id,
                        payload: { is_read: true }
                      });
                    }
                    if (notification.route) {
                      // Guard the server-supplied route against off-site or
                      // protocol-relative values before navigating (same
                      // policy used for auth redirects via resolveRedirect).
                      navigate(resolveRedirect(notification.route));
                    }
                  }}
                />
              );
            })}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
