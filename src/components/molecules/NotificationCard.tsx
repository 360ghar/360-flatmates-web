import type { HTMLAttributes, ReactNode } from "react";
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  Heart,
  MessageCircle,
  XCircle
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { cn, focusRing, toneClasses, type Tone } from "../ui/component-utils";

export type NotificationType =
  | "new_match"
  | "new_message"
  | "listing_approved"
  | "listing_rejected"
  | "visit_scheduled"
  | "visit_confirmed"
  | "general";

export interface NotificationCardData {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  unread?: boolean;
}

export interface NotificationCardProps extends HTMLAttributes<HTMLElement> {
  notification: NotificationCardData;
  icon?: ReactNode;
  interactive?: boolean;
  /**
   * Audit F6 #9: per-type action button. The action wire (accept/decline,
   * join, reschedule) is owned by the B-* blocked tracks; this hook point
   * exposes the slot so future per-type handling can render without an API
   * change.
   */
  actionLabel?: string;
  onAction?: () => void;
}

const notificationConfig: Record<NotificationType, { tone: Tone; icon: ReactNode }> = {
  new_match: { tone: "pink", icon: <Heart aria-hidden="true" className="h-5 w-5" /> },
  new_message: { tone: "blue", icon: <MessageCircle aria-hidden="true" className="h-5 w-5" /> },
  listing_approved: { tone: "success", icon: <CheckCircle2 aria-hidden="true" className="h-5 w-5" /> },
  listing_rejected: { tone: "error", icon: <XCircle aria-hidden="true" className="h-5 w-5" /> },
  visit_scheduled: { tone: "teal", icon: <CalendarCheck aria-hidden="true" className="h-5 w-5" /> },
  visit_confirmed: { tone: "success", icon: <CalendarCheck aria-hidden="true" className="h-5 w-5" /> },
  general: { tone: "accent", icon: <Bell aria-hidden="true" className="h-5 w-5" /> }
};

export function NotificationCard({
  notification,
  icon,
  interactive = false,
  actionLabel,
  onAction,
  className,
  ...props
}: NotificationCardProps) {
  const config = notificationConfig[notification.type];
  const classes = toneClasses[config.tone];

  return (
    <Card
      as="article"
      interactive={interactive}
      aria-label={
        interactive
          ? `${notification.title}: ${notification.description}${notification.unread ? " (unread)" : ""}`
          : undefined
      }
      className={cn(
        "relative flex flex-col gap-3 py-3.5",
        interactive && "hover:bg-paper-2",
        notification.unread && "border-l-[3px] border-l-accent",
        className
      )}
      {...props}
    >
      <div className="flex gap-3">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", classes.soft, classes.text)}>
          {icon ?? config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-body-md font-semibold text-ink">{notification.title}</h3>
          <p className="mt-1 line-clamp-2 text-caption text-ink-2">{notification.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-caption text-ink-3">{notification.timestamp}</span>
          {notification.unread ? (
            <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-label="Unread" role="img" />
          ) : null}
        </div>
      </div>
      {actionLabel && onAction ? (
        // TODO(B-*): wire this to per-type handlers (accept match, decline,
        // reschedule, join visit, etc.) once the B-* tracks unblock.
        <div className="flex justify-end">
          <Button
            type="button"
            size="compact"
            variant="tertiary"
            className={focusRing}
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
          >
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

