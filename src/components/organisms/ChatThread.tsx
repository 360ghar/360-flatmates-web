import type { ChangeEvent, HTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { UserMode } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/StateViews";
import { ChatMessageBubble, type ChatMessageData } from "../molecules/ChatMessageBubble";
import { MatchContextCard, type MatchContextCardData } from "../molecules/MatchContextCard";
import { QnACard, type QnACardProps } from "../molecules/QnACard";
import { cn, focusRing } from "../ui/component-utils";
import { ChatThreadHeader } from "./ChatThreadHeader";
import { ChatComposer } from "./ChatComposer";
import { ScheduleVisitModal } from "./ScheduleVisitModal";
import { BlockUserModal } from "./BlockUserModal";
import { ReportUserModal } from "./ReportUserModal";
import { useChatScrollAnchor } from "./useChatScrollAnchor";

export type ChatReportReason = "spam" | "fake_profile" | "abuse" | "inappropriate" | "other";

export interface ChatThreadParticipant {
  name: string;
  avatarUrl?: string | null;
  mode?: UserMode;
  verified?: boolean;
  compatibilityScore?: number;
}

export interface ChatThreadProps extends HTMLAttributes<HTMLElement> {
  participant: ChatThreadParticipant;
  messages: ChatMessageData[];
  matchContext?: MatchContextCardData;
  qna?: QnACardProps[];
  disconnected?: boolean;
  /** True while the active send mutation is in flight (disables the send button). */
  sending?: boolean;
  /** True while older messages are being fetched (infinite scroll up). */
  loadingMore?: boolean;
  onSend?: (message: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onScheduleVisit?: (data: { scheduledDate: string; specialRequirements: string }) => void;
  onAttachFile?: (file: File) => void;
  onBlock?: () => void;
  onReport?: (reason: ChatReportReason, notes: string) => void;
  /** Called when the user scrolls to the top and more history is available. */
  onLoadMore?: () => void;
}

export function ChatThread({
  participant,
  messages,
  matchContext,
  qna = [],
  disconnected = false,
  sending = false,
  loadingMore = false,
  onSend,
  onRetryMessage,
  onScheduleVisit,
  onAttachFile,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { atBottomRef, handleScroll } = useChatScrollAnchor(logRef, messages, onLoadMore);

  function focusComposer() {
    footerRef.current?.querySelector<HTMLInputElement>("input[type='text'], input:not([type])")?.focus();
  }

  /* Visit scheduling modal state */
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitNotes, setVisitNotes] = useState("");

  /* Safety actions (block / report) */
  const [showMenu, setShowMenu] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ChatReportReason>("spam");
  const [reportNotes, setReportNotes] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  /* Focus the composer when the thread opens. */
  useEffect(() => {
    focusComposer();
  }, []);

  /* Close the safety-actions menu on outside click / Escape. */
  useEffect(() => {
    if (!showMenu) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowMenu(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showMenu]);

  /* Close the emoji picker on outside click / Escape — mirrors the menu above. */
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

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    onAttachFile?.(file);
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
    <section className={cn("flex h-[calc(100dvh-64px-76px-env(safe-area-inset-bottom))] md:h-[calc(100dvh-4rem)] md:min-h-[640px] flex-col overflow-hidden rounded-none border-line bg-surface md:rounded-2xl md:border md:shadow-md", className)} {...props}>
      <ChatThreadHeader
        participant={participant}
        disconnected={disconnected}
        onBlock={onBlock}
        onReport={onReport}
        showMenu={showMenu}
        onToggleMenu={() => setShowMenu((v) => !v)}
        menuRef={menuRef}
        onRequestReport={() => {
          setShowMenu(false);
          setShowReportModal(true);
        }}
        onRequestBlock={() => {
          setShowMenu(false);
          setShowBlockModal(true);
        }}
      />
      <div className="flex flex-col gap-3 border-b border-line bg-surface-soft/60 px-4 py-3">
        {matchContext ? <MatchContextCard item={matchContext} /> : null}
        {qna.map((item) => (
          <QnACard key={item.question} {...item} />
        ))}
      </div>
      <div
        ref={logRef}
        role="log"
        aria-label={`Messages with ${participant.name}`}
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={loadingMore}
        tabIndex={0}
        onScroll={handleScroll}
        className={cn(
          "flex-1 space-y-3 overflow-y-auto bg-paper-2/50 px-4 py-4 outline-none",
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
            icon={<MessageCircle aria-hidden="true" className="h-6 w-6" />}
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
        fileInputRef={fileInputRef}
        emojiPickerRef={emojiPickerRef}
        draft={draft}
        onDraftChange={setDraft}
        showEmojiPicker={showEmojiPicker}
        onToggleEmojiPicker={() => setShowEmojiPicker((open) => !open)}
        onInsertEmoji={insertEmoji}
        onFileChange={handleFileChange}
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
