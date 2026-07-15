import type { ChangeEvent, RefObject } from "react";
import { CalendarPlus, Paperclip, Send, Smile } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { TrustBadge } from "../ui/TrustBadge";
import { cn, focusRing } from "../ui/component-utils";

const EMOJI_OPTIONS = ["😀", "😂", "😊", "😍", "👍", "🙏", "🎉", "🏠", "✨", "😅", "🙌", "🤝"];

export function ChatComposer({
  footerRef,
  fileInputRef,
  emojiPickerRef,
  draft,
  onDraftChange,
  showEmojiPicker,
  onToggleEmojiPicker,
  onInsertEmoji,
  onFileChange,
  onScheduleVisit,
  sending,
  onSubmit
}: {
  footerRef: RefObject<HTMLElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  emojiPickerRef: RefObject<HTMLDivElement | null>;
  draft: string;
  onDraftChange: (value: string) => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  onInsertEmoji: (emoji: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onScheduleVisit: () => void;
  sending: boolean;
  onSubmit: () => void;
}) {
  return (
    <footer ref={footerRef} className="border-t border-line bg-surface/95 p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Choose message attachment"
        onChange={onFileChange}
      />
      <div className="flex items-center gap-2">
        <TrustBadge variant="privacy" className="hidden sm:inline-flex" />
        <div className="relative" ref={emojiPickerRef}>
          <Button
            aria-label="Emoji"
            aria-expanded={showEmojiPicker}
            size="icon"
            variant="icon"
            onClick={onToggleEmojiPicker}
          >
            <Smile aria-hidden="true" className="h-5 w-5" />
          </Button>
          {showEmojiPicker ? (
            <div
              aria-label="Choose emoji"
              className="absolute bottom-full left-0 z-[var(--z-raised)] mb-2 grid w-[min(20rem,calc(100vw-2rem))] grid-cols-6 gap-1 rounded-[12px] border border-line bg-surface-elevated p-2 shadow-md"
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={cn("flex aspect-square min-h-10 w-full items-center justify-center rounded-[8px] text-xl leading-none hover:bg-lavender", focusRing)}
                  onClick={() => onInsertEmoji(emoji)}
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
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            // Audit F6 #16: skip Enter-to-send while an IME composition is
            // active. Both the modern `isComposing` flag and the legacy
            // `keyCode === 229` cover CJK and other IMEs that fire
            // `keydown` Enter to commit the composition.
            if (event.key !== "Enter" || event.shiftKey) return;
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            event.preventDefault();
            onSubmit();
          }}
        />
        <Button
          aria-label="Schedule a visit"
          size="icon"
          variant="icon"
          onClick={onScheduleVisit}
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
          onClick={onSubmit}
        >
          <Send aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
    </footer>
  );
}
