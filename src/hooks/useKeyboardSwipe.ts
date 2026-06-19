import { useEffect } from "react";

interface UseKeyboardSwipeOptions {
  /** Pass `undefined` to skip a handler entirely (no preventDefault for that key). */
  onPass?: () => void;
  onLike?: () => void;
  onSuperLike?: () => void;
  onExpand?: () => void;
  onDismiss?: () => void;
  enabled: boolean;
}

const CAPTURED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Space",
  "Escape"
]);

export function useKeyboardSwipe({
  onPass,
  onLike,
  onSuperLike,
  onExpand,
  onDismiss,
  enabled
}: UseKeyboardSwipeOptions): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!CAPTURED_KEYS.has(event.code)) {
        return;
      }

      // Ignore when user is typing in an input, textarea, or contentEditable element
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Only preventDefault for keys that actually have a handler bound.
      // This prevents the hook from becoming a global key blocker when
      // (e.g.) the match-celebration modal is up and only Escape should
      // be captured.
      switch (event.code) {
        case "ArrowLeft":
          if (onPass) {
            event.preventDefault();
            onPass();
          }
          break;
        case "ArrowRight":
          if (onLike) {
            event.preventDefault();
            onLike();
          }
          break;
        case "ArrowUp":
          if (onSuperLike) {
            event.preventDefault();
            onSuperLike();
          }
          break;
        case "Space":
          if (onExpand) {
            event.preventDefault();
            onExpand();
          }
          break;
        case "Escape":
          if (onDismiss) {
            event.preventDefault();
            onDismiss();
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onPass, onLike, onSuperLike, onExpand, onDismiss]);
}
