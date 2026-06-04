import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn, focusRing, interactiveMotion } from "./component-utils";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "icon";
export type ButtonSize = "compact" | "default" | "tall" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-cta hover:-translate-y-px hover:bg-accent/95 hover:shadow-hover disabled:bg-paper-4 disabled:text-ink-3 disabled:shadow-none",
  secondary:
    "border-[1.5px] border-accent bg-transparent text-accent hover:bg-accent-soft disabled:border-line disabled:bg-transparent disabled:text-ink-3",
  tertiary:
    "bg-transparent text-accent shadow-none hover:bg-accent-soft hover:underline disabled:bg-transparent disabled:text-ink-3",
  icon:
    "bg-transparent text-accent hover:bg-accent-soft disabled:bg-paper-4 disabled:text-ink-3"
};

const sizeClasses: Record<ButtonSize, string> = {
  compact: "min-h-[var(--control-h-sm)] px-4 py-2 text-label-md",
  default: "min-h-[var(--control-h-lg)] px-6 py-4 text-label-lg",
  tall: "min-h-[var(--control-h-xl)] px-6 py-4 text-label-lg",
  icon: "h-10 w-10 p-2"
};

/** Shared classes for Link elements that should look like a Button. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "default",
  fullWidth = false,
): string {
  const resolvedSize = size === "icon" ? "icon" : size;
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] font-semibold active:scale-[0.97]",
    interactiveMotion,
    focusRing,
    variantClasses[variant],
    sizeClasses[resolvedSize],
    fullWidth && "w-full",
  );
}

export function Button({
  variant = "primary",
  size,
  fullWidth = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  const resolvedSize = size ?? (variant === "icon" ? "icon" : "default");
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      data-loading={loading ? "true" : undefined}
      disabled={isDisabled}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] font-semibold active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed",
        interactiveMotion,
        focusRing,
        variantClasses[variant],
        sizeClasses[resolvedSize],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : leadingIcon}
      {variant !== "icon" ? <span className="truncate">{children}</span> : children}
      {!loading ? trailingIcon : null}
    </button>
  );
}
