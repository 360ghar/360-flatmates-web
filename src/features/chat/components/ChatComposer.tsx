import type { RefObject } from "react";
import { CalendarPlus, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn, focusRing } from "@/components/ui/component-utils";

const EMOJI_OPTIONS = ["😀", "😂", "😊", "😍", "👍", "🙏", "🎉", "🏠", "✨", "😅", "🙌", "🤝"];

export function ChatComposer({
  footerRef,
  emojiPickerRef,
  draft,
  onDraftChange,
  showEmojiPicker,
  onToggleEmojiPicker,
  onInsertEmoji,
  onScheduleVisit,
  sending,
  onSubmit
}: {
  footerRef: RefObject<HTMLElement | null>;
  emojiPickerRef: RefObject<HTMLDivElement | null>;
  draft: string;
  onDraftChange: (value: string) => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  onInsertEmoji: (emoji: string) => void;
  onScheduleVisit: () => void;
  sending: boolean;
  onSubmit: () => void;
}) {
  return (
    <footer ref={footerRef} className="paper-grain bg-paper-1 p-3 shadow-[0_-1px_0_var(--color-edge)]">
      <div className="flex items-center gap-2">
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
              role="group"
              className="paper-grain absolute bottom-full left-0 z-[var(--z-raised)] mb-2 grid w-[min(20rem,calc(100vw-2rem))] grid-cols-6 gap-1 rounded-cut-md bg-paper-3 p-2 shadow-md"
            >
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={cn("flex aspect-square min-h-11 w-full items-center justify-center rounded-cut-md text-xl leading-none hover:bg-surface-soft", focusRing)}
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
