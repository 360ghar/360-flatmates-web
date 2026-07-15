import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn, focusRing, interactiveMotion, baseClasses, variantClasses, sizeClasses } from "./component-utils";
import type { ButtonVariant, ButtonSize } from "./component-utils";

export type { ButtonVariant, ButtonSize };

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
