import type { ButtonHTMLAttributes } from "react";
import { Avatar } from "../ui/Avatar";
import { Badge, type UserMode } from "../ui/Badge";
import { cn, focusRing, interactiveMotion } from "../ui/component-utils";

export interface ConversationRowData {
  id: string;
  name: string;
  avatarUrl?: string | null;
  mode?: UserMode;
  preview: string;
  propertyPreview?: string;
  timestamp: string;
  unreadCount?: number;
  highlighted?: boolean;
}

export interface ConversationRowProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  conversation: ConversationRowData;
}

export function ConversationRow({ conversation, className, ...props }: ConversationRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[72px] w-full items-center gap-3 rounded-[9px] px-3 py-2 text-left hover:bg-accent-soft",
        interactiveMotion,
        focusRing,
        conversation.highlighted && "bg-accent-soft",
        className
      )}
      {...props}
    >
      <Avatar name={conversation.name} src={conversation.avatarUrl} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 break-words text-body-md font-semibold text-ink">{conversation.name}</span>
          {conversation.mode ? <Badge mode={conversation.mode} variant="mode" className="md:max-lg:hidden" /> : null}
        </span>
        <span className="mt-1 line-clamp-1 block text-caption text-ink-2">{conversation.preview}</span>
        {conversation.propertyPreview ? (
          <span className="mt-0.5 line-clamp-1 block text-caption text-ink-3">{conversation.propertyPreview}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-eyebrow text-ink-3">{conversation.timestamp}</span>
        {conversation.unreadCount ? <Badge count={conversation.unreadCount} variant="count" /> : null}
      </span>
    </button>
  );
}
