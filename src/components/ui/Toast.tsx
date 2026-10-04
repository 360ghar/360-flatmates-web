import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";
import { cn, focusRing, toneClasses, type Tone } from "./component-utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  type?: ToastType;
  title: string;
  description?: string;
  icon?: ReactNode;
  onDismiss?: () => void;
}

const typeTone: Record<ToastType, Tone> = {
  success: "success",
  error: "error",
  info: "accent",
  warning: "warning"
};

const typeIcon: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 aria-hidden="true" className="h-5 w-5" />,
  error: <XCircle aria-hidden="true" className="h-5 w-5" />,
  info: <Info aria-hidden="true" className="h-5 w-5" />,
  warning: <AlertTriangle aria-hidden="true" className="h-5 w-5" />
};

/** A scallop-edged paper slip (DESIGN.md §8). The Toaster owns placement,
 *  timing, stacking and the live region; this is only the slip. */
export function Toast({ type = "info", title, description, icon, onDismiss, className, ...props }: ToastProps) {
  return (
    // The outer drop-shadow follows the scalloped cut of the inner slip.
    <div className={cn("w-full sm:w-[380px] [filter:drop-shadow(1px_3px_3px_rgb(35_32_28/0.18))]", className)} {...props}>
      <div className="paper-edge-scallop-left paper-grain flex items-start gap-3 rounded-r-cut-md bg-surface-elevated py-3 pl-5 pr-2 text-ink">
        <span className={cn("mt-2.5 shrink-0", toneClasses[typeTone[type]].text)}>{icon ?? typeIcon[type]}</span>
        <div className="min-w-0 flex-1 py-2">
          <p className="text-body-md font-semibold text-ink">{title}</p>
          {description ? <p className="mt-1 text-caption text-ink-2">{description}</p> : null}
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className={cn("grid size-11 shrink-0 place-items-center rounded-cut-md text-ink-3 hover:bg-surface-soft hover:text-ink", focusRing)}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Mount once. Bottom on phones sits above the tab bar. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={12}
      visibleToasts={3}
      offset={24}
      mobileOffset={{ bottom: "calc(var(--bottom-nav-h) + 12px + env(safe-area-inset-bottom))", left: "16px", right: "16px" }}
      toastOptions={{ unstyled: true }}
      containerAriaLabel="Notifications"
    />
  );
}
