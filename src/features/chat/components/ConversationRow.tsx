import { Link, type LinkProps } from "react-router";
import { FLATMATE_MODE_OPTIONS } from "@/lib/data";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, type UserMode } from "@/components/ui/Badge";
import { cn, focusRing, interactiveMotion } from "@/components/ui/component-utils";

export interface ConversationRowData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  mode?: UserMode;
  preview: string;
  propertyPreview?: string;
  timestamp: string;
  unreadCount?: number;
}

export interface ConversationRowProps extends Omit<LinkProps, "children"> {
  conversation: ConversationRowData;
  /** The thread open beside the list (split view). */
  selected?: boolean;
}

const MODE_LABEL = Object.fromEntries(FLATMATE_MODE_OPTIONS.map((o) => [o.value, o.label])) as Record<string, string>;

export function ConversationRow({ conversation, selected = false, className, ...props }: ConversationRowProps) {
  const meta = [conversation.mode ? MODE_LABEL[conversation.mode] : null, conversation.propertyPreview]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      aria-current={selected ? "page" : undefined}
      className={cn(
        "flex min-h-[72px] w-full items-center gap-3 rounded-cut-md px-2 py-2.5 text-left",
        interactiveMotion,
        focusRing,
        selected ? "paper-grain bg-paper-3 shadow-xs" : "hover:bg-surface-soft",
        className
      )}
      {...props}
    >
      {/* Decorative: the row already renders the name as text, so the avatar stays silent. */}
      <Avatar name={conversation.name} src={conversation.avatarUrl} size="sm" alt="" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        {/* Name and time share one line so the preview keeps the full width. */}
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-body-md font-semibold text-ink">{conversation.name}</span>
          <span className="shrink-0 text-caption tabular text-ink-3">{conversation.timestamp}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={cn("min-w-0 flex-1 truncate text-body-md", conversation.unreadCount ? "font-semibold text-ink" : "text-ink-2")}>
            {conversation.preview}
          </span>
          {conversation.unreadCount ? (
            <Badge count={conversation.unreadCount} variant="count" aria-label={`${conversation.unreadCount} unread`} />
          ) : null}
        </span>
        {meta ? <span className="mt-0.5 block truncate text-caption text-ink-3">{meta}</span> : null}
      </span>
    </Link>
  );
}
