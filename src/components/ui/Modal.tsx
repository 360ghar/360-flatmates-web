import type { HTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./component-utils";
import { handleDialogBackdropClick, useNativeDialog } from "./useNativeDialog";

export interface ModalProps extends HTMLAttributes<HTMLDialogElement> {
  open: boolean;
  title?: string;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
  size?: "default" | "wide";
  closeLabel?: string;
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
  const descriptionId = useId();
  const dialogRef = useNativeDialog(open, onClose);

  if (!open) {
    return null;
  }

  // Portal to document.body so the dialog's fixed/top-layer positioning is
  // viewport-relative even when ancestors apply transform/filter (e.g. the
  // .page-fade animation fill mode).
  return createPortal(
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      onClick={(e) => handleDialogBackdropClick(e, onClose)}
      className={cn(
        "paper-grain max-md:paper-edge-torn-top fixed inset-x-0 bottom-0 top-auto m-0 max-h-[92vh] w-full overflow-y-auto bg-surface-elevated p-0 text-ink shadow-lg animate-bottom-sheet-in backdrop:bg-[rgb(18_24_20/0.5)] md:inset-0 md:m-auto md:h-fit md:rounded-cut-lg md:animate-fade-slide-up",
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
      {/* Padding lives on this child, not the dialog itself, so a click landing
          in it hits this div (not the dialog) and isn't mistaken for a backdrop click. */}
      <div className="p-6">
        {title ? (
          <div className="pr-10">
            <h2 className="text-h3 text-ink" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-body-md text-ink-2" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className={cn(title ? "mt-5" : "mt-0")}>{children}</div>
        {footer ? <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">{footer}</div> : null}
      </div>
    </dialog>,
    document.body
  );
}

export interface DrawerProps extends HTMLAttributes<HTMLDialogElement> {
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
  const dialogRef = useNativeDialog(open, onClose);

  if (!open) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      onClick={(e) => handleDialogBackdropClick(e, onClose)}
      className={cn(
        "paper-grain fixed m-0 max-h-none overflow-y-auto bg-surface-elevated p-0 text-ink shadow-lg backdrop:bg-[rgb(18_24_20/0.5)]",
        side === "right"
          ? cn("inset-y-0 right-0 left-auto h-full animate-drawer-in", width === "wide" ? "w-full md:w-[480px]" : "w-full md:w-[400px]")
          : cn(
            "max-md:paper-edge-torn-top inset-x-0 bottom-0 top-auto max-h-[85vh] w-full animate-bottom-sheet-in md:inset-y-0 md:left-auto md:right-0 md:top-0 md:max-h-none md:animate-drawer-in",
            width === "wide" ? "md:w-[480px]" : "md:w-[400px]"
          ),
        className
      )}
      {...props}
    >
      {side === "bottom" ? <div className="mx-auto mt-4 h-1 w-10 rounded-full bg-ink-4 md:hidden" /> : null}
      <div className="flex items-center justify-between gap-4 p-4 pt-5">
        {title ? (
          <h2 className="text-h3 text-ink" id={titleId}>
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
    </dialog>,
    document.body
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
