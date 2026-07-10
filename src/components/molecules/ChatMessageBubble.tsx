import type { HTMLAttributes } from "react";
import { AlertCircle, Check, CheckCheck } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { cn, focusRing } from "../ui/component-utils";

export type ChatMessageSender = "me" | "them" | "system";
export type ChatMessageStatus = "sending" | "sent" | "read" | "failed";

export interface ChatMessageData {
  id: string;
  sender: ChatMessageSender;
  text: string;
  timestamp?: string;
  status?: ChatMessageStatus;
  avatarUrl?: string | null;
  senderName?: string;
}

export interface ChatMessageBubbleProps extends HTMLAttributes<HTMLDivElement> {
  message: ChatMessageData;
  showAvatar?: boolean;
  onRetry?: (messageId: string) => void;
}

export function ChatMessageBubble({
  message,
  showAvatar = true,
  onRetry,
  className,
  ...props
}: ChatMessageBubbleProps) {
  if (message.sender === "system") {
    return (
      <div className={cn("text-center text-caption text-ink-3", className)} {...props}>
        {message.text}
      </div>
    );
  }

  const mine = message.sender === "me";

  return (
    <div className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start", className)} {...props}>
      {!mine && showAvatar ? (
        <Avatar name={message.senderName ?? "Flatmate"} size="compact" src={message.avatarUrl} />
      ) : null}
      <div className={cn("flex max-w-[290px] flex-col", mine ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-body-md font-medium",
            mine
              ? "rounded-bl bg-accent text-white shadow-sm"
              : "rounded-br border border-line bg-surface text-ink shadow-xs"
          )}
        >
          {message.text}
        </div>
        <div className={cn("mt-1 flex items-center gap-1 text-[11px]", mine ? "text-ink-3" : "text-ink-3")}>
          {message.timestamp ? <span>{message.timestamp}</span> : null}
          {mine && message.status === "sent" ? (
            <Check aria-hidden="true" className="h-3.5 w-3.5" aria-label="Sent" />
          ) : null}
          {mine && message.status === "read" ? (
            <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" aria-label="Read" />
          ) : null}
          {mine && message.status === "failed" ? (
            <button
              type="button"
              aria-label="Retry sending message"
              className={cn("inline-flex items-center gap-1 rounded text-error hover:underline", focusRing)}
              onClick={() => onRetry?.(message.id)}
            >
              <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

