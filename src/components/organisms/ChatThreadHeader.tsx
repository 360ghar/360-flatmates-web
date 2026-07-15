import type { RefObject } from "react";
import { Ban, CloudOff, Flag, MoreVertical } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { cn, focusRing } from "../ui/component-utils";
import type { ChatReportReason, ChatThreadParticipant } from "./ChatThread";

export function ChatThreadHeader({
  participant,
  disconnected,
  onBlock,
  onReport,
  showMenu,
  onToggleMenu,
  menuRef,
  onRequestReport,
  onRequestBlock
}: {
  participant: ChatThreadParticipant;
  disconnected: boolean;
  onBlock?: () => void;
  onReport?: (reason: ChatReportReason, notes: string) => void;
  showMenu: boolean;
  onToggleMenu: () => void;
  menuRef: RefObject<HTMLDivElement | null>;
  onRequestReport: () => void;
  onRequestBlock: () => void;
}) {
  return (
    <header className="flex min-h-14 items-center gap-3 border-b border-line bg-surface px-4 shadow-xs">
      <Avatar name={participant.name} size="sm" src={participant.avatarUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-body-md font-semibold text-ink">{participant.name}</h2>
          {participant.verified ? <span className="h-2 w-2 rounded-full bg-success" /> : null}
          {participant.mode ? <Badge mode={participant.mode} variant="mode" /> : null}
          {participant.compatibilityScore ? (
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-caption font-semibold text-success">
              {participant.compatibilityScore}% match
            </span>
          ) : null}
        </div>
      </div>
      {disconnected ? <CloudOff aria-label="Messages may be delayed" className="h-5 w-5 text-ink-3" /> : null}
      {onBlock || onReport ? (
        <div ref={menuRef} className="relative shrink-0">
          <Button
            aria-label="Conversation options"
            aria-haspopup="menu"
            aria-expanded={showMenu}
            size="icon"
            variant="icon"
            onClick={onToggleMenu}
          >
            <MoreVertical aria-hidden="true" className="h-5 w-5" />
          </Button>
          {showMenu ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-[var(--z-raised)] mt-1 w-44 overflow-hidden rounded-[8px] border border-line bg-surface-elevated py-1 shadow-md"
            >
              {onReport ? (
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-body-md text-ink hover:bg-paper-2",
                    focusRing
                  )}
                  onClick={onRequestReport}
                >
                  <Flag aria-hidden="true" className="h-4 w-4 text-ink-3" />
                  Report user
                </button>
              ) : null}
              {onBlock ? (
                <button
                  type="button"
                  role="menuitem"
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-body-md text-error hover:bg-error-soft",
                    focusRing
                  )}
                  onClick={onRequestBlock}
                >
                  <Ban aria-hidden="true" className="h-4 w-4" />
                  Block user
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
