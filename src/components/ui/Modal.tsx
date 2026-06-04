import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./component-utils";

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  title?: string;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
  size?: "default" | "wide";
  closeLabel?: string;
}

function useDialogFocus(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = panel?.querySelectorAll<HTMLElement>(focusableSelector);
    focusable?.[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) {
        return;
      }

      const elements = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (elements.length === 0) {
        event.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to whatever was focused before the dialog opened.
      previouslyFocused?.focus?.();
    };
  }, [onClose, open]);

  return panelRef;
}

export function Modal({
  open,
  title,
  description,
  footer,
  onClose,
  size = "default",
  closeLabel = "Close dialog",
  children,
  className,
  ...props
}: ModalProps) {
  const titleId = useId();
  const panelRef = useDialogFocus(open, onClose);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-end justify-center bg-paper/88 p-0 backdrop-blur-[9px] md:items-center md:p-6">
      <button aria-label={closeLabel} className="absolute inset-0 cursor-default" type="button" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-surface-elevated p-6 text-ink shadow-lg animate-fade-slide-up md:rounded-lg",
          size === "default" ? "md:max-w-[480px]" : "md:max-w-[600px]",
          className
        )}
        {...props}
      >
        <Button
          aria-label={closeLabel}
          className="absolute right-4 top-4"
          size="icon"
          variant="icon"
          onClick={onClose}
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </Button>
        {title ? (
          <div className="pr-10">
            <h2 className="text-h3 font-semibold text-ink" id={titleId}>
              {title}
            </h2>
            {description ? <p className="mt-2 text-body-md text-ink-2">{description}</p> : null}
          </div>
        ) : null}
        <div className={cn(title ? "mt-5" : "mt-0")}>{children}</div>
        {footer ? <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">{footer}</div> : null}
      </div>
    </div>
  );
}

export interface DrawerProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  title?: string;
  onClose: () => void;
  side?: "right" | "bottom";
  width?: "standard" | "wide";
}

export function Drawer({
  open,
  title,
  onClose,
  side = "right",
  width = "standard",
  children,
  className,
  ...props
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useDialogFocus(open, onClose);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] bg-paper/88 backdrop-blur-[9px]">
      <button aria-label="Close drawer" className="absolute inset-0 cursor-default" type="button" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "absolute overflow-y-auto border-line bg-surface-elevated text-ink shadow-lg",
          side === "right"
            ? cn("bottom-0 right-0 top-0 border-l animate-drawer-in", width === "wide" ? "w-full md:w-[480px]" : "w-full md:w-[400px]")
            : cn(
                "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl border-t animate-bottom-sheet-in md:left-auto md:top-0 md:max-h-none md:rounded-none md:border-l md:border-t-0 md:animate-drawer-in",
                width === "wide" ? "md:w-[480px]" : "md:w-[400px]"
              ),
          className
        )}
        {...props}
      >
        {side === "bottom" ? <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink-4" /> : null}
        <div className="flex items-center justify-between gap-4 border-b border-line p-4">
          {title ? (
            <h2 className="text-h3 font-semibold text-ink" id={titleId}>
              {title}
            </h2>
          ) : (
            <span />
          )}
          <Button aria-label="Close drawer" size="icon" variant="icon" onClick={onClose}>
            <X aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export type BottomSheetProps = Omit<DrawerProps, "side">;

export function BottomSheet(props: BottomSheetProps) {
  return <Drawer {...props} side="bottom" />;
}

export function ModalFooterAction({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button className={cn("w-full md:w-auto", className)} {...props}>
      {children}
    </Button>
  );
}
