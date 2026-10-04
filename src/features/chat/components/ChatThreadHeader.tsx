import { ArrowLeft, Ban, CloudOff, Flag, MoreVertical } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/component-utils";
import type { ChatThreadParticipant } from "@/features/chat/lib/types";

const itemClasses =
  "flex min-h-11 cursor-default select-none items-center gap-2 rounded-cut-sm px-3 text-body-md outline-none data-[highlighted]:bg-surface-soft";

/** Who you are talking to, and the safety menu (report, block). */
export function ChatThreadHeader({
  participant,
  disconnected,
  onBack,
  onRequestReport,
  onRequestBlock
}: {
  participant: ChatThreadParticipant;
  disconnected: boolean;
  onBack?: () => void;
  onRequestReport?: () => void;
  onRequestBlock?: () => void;
}) {
  const meta = [participant.compatibilityScore != null ? `${participant.compatibilityScore}% match` : null].filter(Boolean);
  return (
    <header className="flex min-h-16 items-center gap-3 bg-surface px-3 shadow-[0_1px_0_var(--color-edge)] sm:px-4">
      {onBack ? (
        // Phones use the top bar's Back; the split view at lg shows the list beside the thread.
        <Button aria-label="Back to chats" size="icon" variant="icon" className="-ml-1 hidden md:inline-flex lg:hidden" onClick={onBack}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
      ) : null}
      <Avatar name={participant.name} size="sm" src={participant.avatarUrl} />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-body-lg font-semibold text-ink">{participant.name}</h2>
        <p className="flex flex-wrap items-center gap-x-2 text-caption text-ink-2">
          {participant.mode ? <Badge mode={participant.mode} variant="mode" /> : null}
          {meta.map((m) => (
            <span key={m} className="tabular text-pine">
              {m}
            </span>
          ))}
        </p>
      </div>
      {disconnected ? <CloudOff aria-label="Messages may be delayed" className="h-5 w-5 shrink-0 text-ink-3" /> : null}
      {onRequestReport || onRequestBlock ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button aria-label="Conversation options" size="icon" variant="icon">
              <MoreVertical aria-hidden="true" className="h-5 w-5" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="paper-grain z-[var(--z-overlay)] min-w-48 rounded-cut-md bg-paper-3 p-1 shadow-md"
            >
              {onRequestReport ? (
                <DropdownMenu.Item className={cn(itemClasses, "text-ink")} onSelect={onRequestReport}>
                  <Flag aria-hidden="true" className="h-4 w-4 text-ink-3" />
                  Report
                </DropdownMenu.Item>
              ) : null}
              {onRequestBlock ? (
                <DropdownMenu.Item className={cn(itemClasses, "text-danger")} onSelect={onRequestBlock}>
                  <Ban aria-hidden="true" className="h-4 w-4" />
                  Block
                </DropdownMenu.Item>
              ) : null}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : null}
    </header>
  );
}
