import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Button } from "./Button";
import { cn, toneClasses, type Tone } from "./component-utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  type?: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  icon?: ReactNode;
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

export function Toast({
  type = "info",
  title,
  description,
  action,
  icon,
  className,
  ...props
}: ToastProps) {
  const classes = toneClasses[typeTone[type]];

  return (
    <div
      role={type === "error" || type === "warning" ? "alert" : "status"}
      aria-live={type === "error" || type === "warning" ? "assertive" : "polite"}
      className={cn(
        "flex w-full max-w-[400px] gap-3 rounded-2xl border border-line bg-surface-elevated p-4 text-ink shadow-lg animate-fade-slide-up",
        className
      )}
      {...props}
    >
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", classes.soft, classes.text)}>
        {icon ?? typeIcon[type]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-ink">{title}</p>
        {description ? <p className="mt-1 text-caption text-ink-2">{description}</p> : null}
        {action ? (
          <Button className="mt-3" size="compact" variant="tertiary" onClick={action.onClick}>
            {action.label}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export interface ToastViewportProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ToastViewport({ children, className, ...props }: ToastViewportProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-5 bottom-5 z-[var(--z-toast)] flex flex-col-reverse items-center gap-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-auto md:right-6 md:top-6 md:items-end md:pb-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
