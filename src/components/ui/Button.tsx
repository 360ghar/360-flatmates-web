import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn, focusRing, interactiveMotion } from "./component-utils";

export type ButtonVariant =
  | "primary"
  | "highlight"
  | "secondary"
  | "tertiary"
  | "icon"
  | "google"
  | "destructive"
  | "inverted";
export type ButtonSize = "compact" | "default" | "tall" | "icon";

interface ButtonBase {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** When true, the button is visually disabled. For anchors, sets aria-disabled. */
  disabled?: boolean;
}

/** Button renders as a native <button> (default). */
interface ButtonAsButtonProps
  extends ButtonBase,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBase> {
  as?: "button";
}

/** Button renders as an <a> anchor (for use with external links). */
interface ButtonAsAnchorProps
  extends ButtonBase,
    Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBase> {
  as: "a";
}

export type ButtonProps = ButtonAsButtonProps | ButtonAsAnchorProps;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-cta hover:-translate-y-px hover:bg-accent/95 hover:shadow-hover disabled:bg-paper-4 disabled:text-ink-3 disabled:shadow-none",
  highlight:
    "bg-action text-action-ink shadow-sm hover:-translate-y-px hover:bg-action-hover hover:shadow-hover disabled:bg-paper-4 disabled:text-ink-3 disabled:shadow-none",
  secondary:
    "border-[1.5px] border-accent bg-transparent text-accent hover:bg-accent-soft disabled:border-line disabled:bg-transparent disabled:text-ink-3",
  tertiary:
    "bg-transparent text-accent shadow-none hover:bg-accent-soft hover:underline disabled:bg-transparent disabled:text-ink-3",
  icon:
    "bg-transparent text-accent hover:bg-accent-soft disabled:bg-paper-4 disabled:text-ink-3",
  google:
    "bg-google-bg text-google-text border border-google-border shadow-sm hover:bg-google-hover hover:shadow-md disabled:bg-paper-4 disabled:text-ink-3 disabled:border-transparent",
  destructive:
    "bg-error text-white shadow-cta hover:-translate-y-px hover:bg-error/95 hover:shadow-hover disabled:bg-paper-4 disabled:text-ink-3 disabled:shadow-none",
  inverted:
    "bg-surface-elevated text-accent shadow-cta hover:-translate-y-px hover:bg-surface hover:shadow-hover disabled:bg-paper-4 disabled:text-ink-3 disabled:shadow-none"
};

const sizeClasses: Record<ButtonSize, string> = {
  compact: "min-h-[var(--touch-min)] px-4 py-2 text-label-md",
  default: "min-h-[var(--control-h-lg)] px-6 py-4 text-label-lg",
  tall: "min-h-[var(--control-h-xl)] px-6 py-4 text-label-lg",
  icon: "h-10 w-10 p-2"
};

// NOTE (#7): `shrink-0` is intentionally NOT in `baseClasses`. A button that is
// both `shrink-0` and `w-full` (fullWidth) demands 100% width AND refuses to
// shrink, so when it sits in a flex row next to a sibling (e.g. Back + Next)
// the combined width exceeds 100% and the fullWidth button bleeds past the
// container edge. Instead `shrink-0` is applied only to non-fullWidth buttons;
// fullWidth buttons get `w-full min-w-0` — full-width when alone, and able to
// shrink (past their content min-size, handled by the inner `truncate` span)
// when sharing a row. We avoid `flex-1` here because it would make fullWidth
// buttons grow along the main axis of `flex-col` containers (stretching them
// vertically in stacked forms), a regression for the many auth/form layouts.
const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold active:scale-[0.97]";

/** Shared classes for Link elements that should look like a Button. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "default",
  fullWidth = false,
): string {
  const resolvedSize = size === "icon" ? "icon" : size;
  return cn(
    baseClasses,
    interactiveMotion,
    focusRing,
    variantClasses[variant],
    sizeClasses[resolvedSize],
    fullWidth ? "w-full min-w-0" : "shrink-0",
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
  as,
  ...props
}: ButtonProps) {
  const resolvedSize = size ?? (variant === "icon" ? "icon" : "default");
  const isDisabled = disabled || loading;

  const sharedClassName = cn(
    baseClasses,
    as === "a" ? "cursor-pointer" : "disabled:pointer-events-none disabled:cursor-not-allowed",
    interactiveMotion,
    focusRing,
    variantClasses[variant],
    sizeClasses[resolvedSize],
    fullWidth ? "w-full min-w-0" : "shrink-0",
    className
  );

  if (as === "a") {
    const { href, target, rel, ...anchorProps } =
      props as AnchorHTMLAttributes<HTMLAnchorElement> & Record<string, unknown>;
    return (
      <a
        href={isDisabled ? undefined : href}
        target={target}
        rel={rel}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        data-loading={loading ? "true" : undefined}
        className={sharedClassName}
        {...(anchorProps as Omit<typeof anchorProps, "children">)}
      >
        {loading ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : leadingIcon}
        {variant !== "icon" ? <span className="truncate">{children}</span> : children}
        {!loading ? trailingIcon : null}
      </a>
    );
  }

  return (
    <button
      type={type as "button" | "submit" | "reset"}
      aria-busy={loading || undefined}
      data-loading={loading ? "true" : undefined}
      disabled={isDisabled}
      className={sharedClassName}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {loading ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : leadingIcon}
      {variant !== "icon" ? <span className="truncate">{children}</span> : children}
      {!loading ? trailingIcon : null}
    </button>
  );
}
