import type { ChangeEvent, HTMLAttributes } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Ban, CalendarPlus, CloudOff, Flag, MessageCircle, MoreVertical, Paperclip, Send, Smile } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Badge, type UserMode } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { TrustBadge } from "../ui/TrustBadge";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/StateViews";
import { ChatMessageBubble, type ChatMessageData } from "../molecules/ChatMessageBubble";
import { MatchContextCard, type MatchContextCardData } from "../molecules/MatchContextCard";
import { QnACard, type QnACardProps } from "../molecules/QnACard";
import { cn, focusRing } from "../ui/component-utils";

export type ChatReportReason = "spam" | "fake_profile" | "abuse" | "inappropriate" | "other";

const REPORT_REASONS: { value: ChatReportReason; label: string }[] = [
  { value: "spam", label: "Spam or scam" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "abuse", label: "Harassment or abuse" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "other", label: "Something else" }
];

/** Distance from the bottom (px) within which we consider the user "at bottom". */
const AT_BOTTOM_THRESHOLD = 96;

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
  const atBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);
  const prevFirstIdRef = useRef<string | null>(null);
  const scrollSnapshotRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);

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

  /* Track whether the user is pinned to the bottom of the log. We only
     auto-scroll on new messages when they already were, so incoming history
     or peer messages never yank them away from what they are reading. */
  function recomputeAtBottom() {
    const el = logRef.current;
    if (!el) return;
    atBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight <= AT_BOTTOM_THRESHOLD;
  }

  /* Scroll to top triggers history load. */
  function handleScroll() {
    recomputeAtBottom();
    if (logRef.current && logRef.current.scrollTop === 0 && onLoadMore) {
      onLoadMore();
    }
  }

  /* Scroll management: detect prepend (history) vs append (new message) and
     anchor/scroll accordingly. All ref access is inside useLayoutEffect to
     satisfy the react-hooks/refs lint rule. Runs before paint. */
  useLayoutEffect(() => {
    const el = logRef.current;
    if (!el) return;

    const countChanged = messages.length !== prevMsgCountRef.current;
    const currentFirstId = messages.length > 0 ? messages[0].id : null;
    const isPrepend = countChanged
      && prevFirstIdRef.current !== null
      && currentFirstId !== null
      && currentFirstId !== prevFirstIdRef.current;

    if (isPrepend && scrollSnapshotRef.current) {
      // History prepended: anchor to keep the same visual position.
      // Use the previously-first message's offsetTop to avoid overcounting
      // any appended messages that may also be in this render cycle.
      const { scrollTop } = scrollSnapshotRef.current;
      const oldFirstId = prevFirstIdRef.current;
      if (oldFirstId) {
        const oldFirstEl = el.querySelector<HTMLElement>(`[data-message-id="${oldFirstId}"]`);
        if (oldFirstEl) {
          el.scrollTop = scrollTop + oldFirstEl.offsetTop;
        } else {
          el.scrollTop = el.scrollHeight;
        }
      } else {
        el.scrollTop = el.scrollHeight;
      }
      scrollSnapshotRef.current = null;
    } else if (countChanged && messages.length > 0) {
      if (scrollSnapshotRef.current && atBottomRef.current) {
        // Appended while at bottom: scroll to new end.
        el.scrollTop = el.scrollHeight;
        scrollSnapshotRef.current = null;
      } else if (prevMsgCountRef.current === 0) {
        // Initial load: scroll to bottom.
        el.scrollTop = el.scrollHeight;
      }
    }

    // Snapshot current scroll state for the next change detection cycle.
    scrollSnapshotRef.current = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
    };
    prevMsgCountRef.current = messages.length;
    prevFirstIdRef.current = currentFirstId;
  }, [messages]);

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
              onClick={() => setShowMenu((v) => !v)}
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
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
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
                    onClick={() => {
                      setShowMenu(false);
                      setShowBlockModal(true);
                    }}
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
      <footer ref={footerRef} className="border-t border-line bg-surface/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Choose message attachment"
          onChange={handleFileChange}
        />
        <div className="flex items-center gap-2">
          <TrustBadge variant="privacy" className="hidden sm:inline-flex" />
          <div className="relative" ref={emojiPickerRef}>
            <Button
              aria-label="Emoji"
              aria-expanded={showEmojiPicker}
              size="icon"
              variant="icon"
              onClick={() => setShowEmojiPicker((open) => !open)}
            >
              <Smile aria-hidden="true" className="h-5 w-5" />
            </Button>
            {showEmojiPicker ? (
              <div
                aria-label="Choose emoji"
                className="absolute bottom-full left-0 z-[var(--z-raised)] mb-2 grid w-[min(20rem,calc(100vw-2rem))] grid-cols-6 gap-1 rounded-[12px] border border-line bg-surface-elevated p-2 shadow-md"
              >
                {["😀", "😂", "😊", "😍", "👍", "🙏", "🎉", "🏠", "✨", "😅", "🙌", "🤝"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className={cn("flex aspect-square min-h-10 w-full items-center justify-center rounded-[8px] text-xl leading-none hover:bg-lavender", focusRing)}
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Input
            aria-label="Type a message"
            placeholder="Type a message..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Audit F6 #16: skip Enter-to-send while an IME composition is
              // active. Both the modern `isComposing` flag and the legacy
              // `keyCode === 229` cover CJK and other IMEs that fire
              // `keydown` Enter to commit the composition.
              if (event.key !== "Enter" || event.shiftKey) return;
              if (event.nativeEvent.isComposing || event.keyCode === 229) return;
              event.preventDefault();
              submit();
            }}
          />
          <Button
            aria-label="Schedule a visit"
            size="icon"
            variant="icon"
            onClick={() => setShowScheduleModal(true)}
          >
            <CalendarPlus aria-hidden="true" className="h-5 w-5" />
          </Button>
          <Button
            aria-label="Attach image"
            size="icon"
            variant="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip aria-hidden="true" className="h-5 w-5" />
          </Button>
          <Button
            aria-label="Send message"
            aria-busy={sending}
            disabled={!draft.trim() || sending}
            size="icon"
            onClick={submit}
          >
            <Send aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
      </footer>

      {/* Schedule Visit Modal */}
      <Modal
        open={showScheduleModal}
        title="Schedule a Visit"
        description={`Schedule a visit with ${participant.name}`}
        onClose={() => setShowScheduleModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowScheduleModal(false)}>
              Cancel
            </Button>
            <Button disabled={!visitDate} onClick={handleScheduleVisit}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="visit-date" className="text-label-md text-ink-2">
              Date
            </label>
            <input
              id="visit-date"
              type="date"
              className="h-12 w-full rounded-[8px] border border-line bg-surface px-3 text-body-md text-ink focus:border-accent focus:focus:outline-none"
              value={visitDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setVisitDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="visit-notes" className="text-label-md text-ink-2">
              Special requirements (optional)
            </label>
            <textarea
              id="visit-notes"
              rows={3}
              placeholder="Any special requests or notes..."
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              className="w-full rounded-[8px] border border-line bg-surface px-3 py-3 text-body-md text-ink placeholder:text-ink-3 focus:border-accent focus:focus:outline-none resize-y"
            />
          </div>
        </div>
      </Modal>

      {/* Block confirmation */}
      <Modal
        open={showBlockModal}
        title={`Block ${participant.name}?`}
        description="They won't be able to message you or see your profile, and this conversation will close. You can unblock them later from Settings."
        onClose={() => setShowBlockModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowBlockModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="bg-error hover:bg-error" onClick={confirmBlock}>
              Block
            </Button>
          </>
        }
      >
        <p className="text-body-md text-ink-2">
          Blocking is a safety action. If you also feel unsafe, consider reporting them.
        </p>
      </Modal>

      {/* Report user */}
      <Modal
        open={showReportModal}
        title={`Report ${participant.name}`}
        description="Tell us what's wrong. Reports are confidential and reviewed by our team."
        onClose={() => setShowReportModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" className="bg-error hover:bg-error" onClick={confirmReport}>
              Submit report
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-label-md text-ink-2">Reason</legend>
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex cursor-pointer items-center gap-2 text-body-md text-ink"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={reason.value}
                  checked={reportReason === reason.value}
                  onChange={() => setReportReason(reason.value)}
                  className="h-4 w-4 accent-accent"
                />
                {reason.label}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-notes" className="text-label-md text-ink-2">
              Details (optional)
            </label>
            <textarea
              id="report-notes"
              rows={3}
              placeholder="Add any context that helps us review this..."
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              className="w-full resize-y rounded-[8px] border border-line bg-surface px-3 py-3 text-body-md text-ink placeholder:text-ink-3 focus:border-accent focus:focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
