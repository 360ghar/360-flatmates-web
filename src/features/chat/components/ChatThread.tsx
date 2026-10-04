import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { ChatReportReason, ChatThreadParticipant } from "@/features/chat/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/StateViews";
import { ChatMessageBubble, type ChatMessageData } from "./ChatMessageBubble";
import { MatchContextCard, type MatchContextCardData } from "./MatchContextCard";
import { QnACard, type QnACardProps } from "./QnACard";
import { cn, focusRing } from "@/components/ui/component-utils";
import { ChatThreadHeader } from "./ChatThreadHeader";
import { ChatComposer } from "./ChatComposer";
import { ScheduleVisitModal } from "@/features/visits/components/ScheduleVisitModal";
import { BlockUserModal } from "./BlockUserModal";
import { ReportUserModal } from "./ReportUserModal";
import { useChatScrollAnchor } from "@/features/chat/hooks/useChatScrollAnchor";


export interface ChatThreadProps extends HTMLAttributes<HTMLElement> {
  participant: ChatThreadParticipant;
  messages: ChatMessageData[];
  matchContext?: MatchContextCardData;
  qna?: QnACardProps[];
  disconnected?: boolean;
  /** Inline strip under the header, e.g. why sending is unavailable. */
  notice?: ReactNode;
  /** True while the active send mutation is in flight (disables the send button). */
  sending?: boolean;
  /** True while older messages are being fetched (infinite scroll up). */
  loadingMore?: boolean;
  onSend?: (message: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onScheduleVisit?: (data: { scheduledDate: string; specialRequirements: string }) => void;
  onBlock?: () => void;
  onReport?: (reason: ChatReportReason, notes: string) => void;
  /** Called when the user scrolls to the top and more history is available. */
  onLoadMore?: () => void;
  /** Back to the list; shown in the header where the shell has no Back of its own. */
  onBack?: () => void;
}

export function ChatThread({
  participant,
  messages,
  matchContext,
  qna = [],
  disconnected = false,
  notice,
  sending = false,
  loadingMore = false,
  onSend,
  onRetryMessage,
  onScheduleVisit,
  onBack,
  onBlock,
  onReport,
  onLoadMore,
  className,
  ...props
}: ChatThreadProps) {
  const [draft, setDraft] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const { atBottomRef, handleScroll } = useChatScrollAnchor(logRef, messages, onLoadMore);

  function focusComposer() {
    footerRef.current?.querySelector<HTMLInputElement>("input[type='text'], input:not([type])")?.focus();
  }

  /* Visit scheduling modal state */
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  /* Safety actions (block / report) */
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ChatReportReason>("spam");
  const [reportNotes, setReportNotes] = useState("");
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  /* Focus the composer when the thread opens. */
  useEffect(() => {
    focusComposer();
  }, []);

  /* Close the emoji picker on outside click or Escape. */
  useEffect(() => {
    if (!showEmojiPicker) return;
    function onPointerDown(event: PointerEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowEmojiPicker(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showEmojiPicker]);

  function submit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    // The user explicitly sent, so always stick to the bottom for their message.
    atBottomRef.current = true;
    onSend?.(trimmed);
    setDraft("");
    focusComposer();
  }

  function insertEmoji(emoji: string) {
    setDraft((value) => `${value}${emoji}`);
    setShowEmojiPicker(false);
    requestAnimationFrame(focusComposer);
  }

  function confirmBlock() {
    onBlock?.();
    setShowBlockModal(false);
  }

  function confirmReport() {
    onReport?.(reportReason, reportNotes.trim());
    setShowReportModal(false);
    setReportReason("spam");
    setReportNotes("");
  }

  function handleScheduleVisit() {
    if (!visitDate) return;
    onScheduleVisit?.({
      scheduledDate: visitDate,
      specialRequirements: visitNotes,
    });
    setShowScheduleModal(false);
    setVisitDate("");
    setVisitNotes("");
  }

  return (
    <section className={cn("flex h-full flex-col overflow-hidden bg-surface md:rounded-hand md:shadow-sm", className)} {...props}>
      <ChatThreadHeader
        participant={participant}
        disconnected={disconnected}
        onBack={onBack}
        onRequestReport={onReport ? () => setShowReportModal(true) : undefined}
        onRequestBlock={onBlock ? () => setShowBlockModal(true) : undefined}
      />
      {notice}
      {matchContext || qna.length ? (
        <div className="flex flex-col gap-3 bg-surface-soft/60 px-4 py-3 shadow-[0_1px_0_var(--color-edge)]">
          {matchContext ? <MatchContextCard item={matchContext} /> : null}
          {qna.map((item) => (
            <QnACard key={item.question} {...item} />
          ))}
        </div>
      ) : null}
      <div
        ref={logRef}
        role="log"
        aria-label={`Messages with ${participant.name}`}
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={loadingMore}
        // A scrollable log must be reachable from the keyboard (axe scrollable-region-focusable).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onScroll={handleScroll}
        className={cn(
          "flex-1 space-y-3 overflow-y-auto bg-surface-soft/50 px-4 py-4 outline-none",
          focusRing
        )}
      >
        {loadingMore ? (
          <div className="flex justify-center py-2" aria-hidden="true">
            <Spinner size="sm" />
          </div>
        ) : null}
        {messages.length === 0 && !loadingMore ? (
          <EmptyState
            title="Start the conversation"
            description={`Send a message to ${participant.name} to get the conversation going.`}
            scene="chat"
            className="mt-8"
          />
        ) : (
          messages.map((message, i) => {
            const prev = i > 0 ? messages[i - 1] : undefined;
            const showAvatar = message.sender !== "me" && message.sender !== "system"
              && (!prev || prev.sender !== message.sender);
            return (
              <ChatMessageBubble
                key={message.id}
                data-message-id={message.id}
                message={message}
                showAvatar={showAvatar}
                onRetry={onRetryMessage}
              />
            );
          })
        )}
      </div>
      <ChatComposer
        footerRef={footerRef}
        emojiPickerRef={emojiPickerRef}
        draft={draft}
        onDraftChange={setDraft}
        showEmojiPicker={showEmojiPicker}
        onToggleEmojiPicker={() => setShowEmojiPicker((open) => !open)}
        onInsertEmoji={insertEmoji}
        onScheduleVisit={() => setShowScheduleModal(true)}
        sending={sending}
        onSubmit={submit}
      />

      <ScheduleVisitModal
        open={showScheduleModal}
        participantName={participant.name}
        visitDate={visitDate}
        onVisitDateChange={setVisitDate}
        visitNotes={visitNotes}
        onVisitNotesChange={setVisitNotes}
        onClose={() => setShowScheduleModal(false)}
        onSubmit={handleScheduleVisit}
      />

      <BlockUserModal
        open={showBlockModal}
        participantName={participant.name}
        onClose={() => setShowBlockModal(false)}
        onConfirm={confirmBlock}
      />

      <ReportUserModal
        open={showReportModal}
        participantName={participant.name}
        reportReason={reportReason}
        onReportReasonChange={setReportReason}
        reportNotes={reportNotes}
        onReportNotesChange={setReportNotes}
        onClose={() => setShowReportModal(false)}
        onSubmit={confirmReport}
      />
    </section>
  );
}

export type { ChatReportReason, ChatThreadParticipant };
