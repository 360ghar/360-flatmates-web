import { useEffect, useRef } from "react";

/**
 * Opens/closes a native `<dialog>` in lockstep with `open`, using the
 * platform's own modal focus trap, Escape handling, and top-layer stacking
 * instead of hand-rolled equivalents. `open` stays the source of truth: a
 * `cancel` (Escape) is intercepted and routed through `onClose` rather than
 * letting the browser close the element itself.
 */
export function useNativeDialog(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Latest-ref: most callers pass an inline `onClose`, which would otherwise
  // force this effect to tear down and reopen the dialog (flicker + focus
  // reset) on every parent re-render, not just when `open` changes.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialog.showModal();

    // Body scroll lock: prevent the page from scrolling while the dialog is open.
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function handleCancel(event: Event) {
      // Escape fires `cancel` then `close`; keep React state as the source of
      // truth for open/closed instead of letting the browser close it first.
      event.preventDefault();
      onCloseRef.current();
    }
    dialog.addEventListener("cancel", handleCancel);

    return () => {
      dialog.removeEventListener("cancel", handleCancel);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      if (dialog.open) dialog.close();
      previouslyFocused?.focus?.();
    };
  }, [open]);

  return dialogRef;
}

/** Close when a click lands directly on the dialog element itself (i.e. on
 *  `::backdrop`, since the dialog has no padding of its own) rather than on
 *  the content inside it. */
export function handleDialogBackdropClick(
  event: React.MouseEvent<HTMLDialogElement>,
  onClose: () => void
) {
  if (event.target === event.currentTarget) onClose();
}
