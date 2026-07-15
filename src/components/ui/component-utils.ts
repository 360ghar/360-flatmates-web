import type { ReactNode } from "react";

export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

export function clampPercentage(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "36";
}

export type Tone =
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "teal"
  | "blue"
  | "purple"
  | "pink";

export const toneClasses: Record<
  Tone,
  {
    soft: string;
    /** Brand/strong color, for icons or text on a plain (paper/surface) background. */
    text: string;
    /** Accessible text color for use ON the matching `soft` background (the "ink" tier). */
    inkText: string;
    border: string;
    icon: string;
    dot: string;
  }
> = {
  accent: {
    soft: "bg-accent-soft",
    text: "text-accent",
    inkText: "text-accent",
    border: "border-accent",
    icon: "text-accent",
    dot: "bg-accent"
  },
  success: {
    soft: "bg-success-soft",
    text: "text-success",
    inkText: "text-success",
    border: "border-success",
    icon: "text-success",
    dot: "bg-success"
  },
  warning: {
    soft: "bg-warning-soft",
    text: "text-warning",
    inkText: "text-warning",
    border: "border-warning",
    icon: "text-warning",
    dot: "bg-warning"
  },
  error: {
    soft: "bg-error-soft",
    text: "text-error",
    inkText: "text-error",
    border: "border-error",
    icon: "text-error",
    dot: "bg-error"
  },
  info: {
    soft: "bg-accent-soft",
    text: "text-accent",
    inkText: "text-accent",
    border: "border-accent",
    icon: "text-accent",
    dot: "bg-accent"
  },
  neutral: {
    soft: "bg-surface-soft",
    text: "text-ink-2",
    inkText: "text-ink-2",
    border: "border-line",
    icon: "text-ink-3",
    dot: "bg-ink-3"
  },
  teal: {
    soft: "bg-teal-soft",
    text: "text-teal-mid",
    inkText: "text-teal-ink",
    border: "border-teal-mid",
    icon: "text-teal-mid",
    dot: "bg-teal-mid"
  },
  blue: {
    soft: "bg-blue-soft",
    text: "text-blue-mid",
    inkText: "text-blue-ink",
    border: "border-blue-mid",
    icon: "text-blue-mid",
    dot: "bg-blue-mid"
  },
  purple: {
    soft: "bg-purple-soft",
    text: "text-purple-mid",
    inkText: "text-purple-ink",
    border: "border-purple-mid",
    icon: "text-purple-mid",
    dot: "bg-purple-mid"
  },
  pink: {
    soft: "bg-pink-soft",
    text: "text-pink-mid",
    inkText: "text-pink-ink",
    border: "border-pink-mid",
    icon: "text-pink-mid",
    dot: "bg-pink-mid"
  }
};

export const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** Standard interactive transition. Consumes the motion tokens; collapses under reduced-motion. */
export const interactiveMotion =
  "transition-[background-color,border-color,box-shadow,color,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] motion-reduce:transition-none motion-reduce:transform-none";

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

export const variantClasses: Record<ButtonVariant, string> = {
  /* Rausch primary — brand voltage for main CTAs.
     Disabled uses primary-disabled (theme-aware) + muted ink text for contrast
     in both light (soft pink fill) and dark (deep muted fill). */
  primary:
    "bg-accent text-white shadow-cta hover:-translate-y-px hover:bg-primary-active hover:shadow-hover disabled:bg-primary-disabled disabled:text-ink-2 disabled:shadow-none disabled:translate-y-0",
  /* Ink secondary fill — Airbnb black button, distinct from Rausch */
  highlight:
    "bg-action text-action-ink shadow-sm hover:-translate-y-px hover:bg-action-hover hover:shadow-hover disabled:bg-surface-soft disabled:text-ink-3 disabled:shadow-none disabled:translate-y-0",
  secondary:
    "border-[1.5px] border-ink bg-transparent text-ink hover:bg-surface-soft disabled:border-line disabled:bg-transparent disabled:text-ink-3",
  tertiary:
    "bg-transparent text-ink shadow-none hover:bg-surface-soft hover:underline disabled:bg-transparent disabled:text-ink-3",
  icon:
    "bg-transparent text-ink hover:bg-surface-soft disabled:bg-surface-soft disabled:text-ink-3",
  google:
    "bg-google-bg text-google-text border border-google-border shadow-sm hover:bg-google-hover hover:shadow-md disabled:bg-surface-soft disabled:text-ink-3 disabled:border-transparent",
  destructive:
    "bg-error text-white shadow-sm hover:-translate-y-px hover:bg-error/95 hover:shadow-hover disabled:bg-primary-disabled disabled:text-ink-2 disabled:shadow-none disabled:translate-y-0",
  inverted:
    "bg-surface-elevated text-accent shadow-sm hover:-translate-y-px hover:bg-surface hover:shadow-hover disabled:bg-surface-soft disabled:text-ink-3 disabled:shadow-none disabled:translate-y-0"
};

export const sizeClasses: Record<ButtonSize, string> = {
  /* Sentence-case body labels (Airbnb) — not uppercase label-lg */
  compact: "min-h-[var(--touch-min)] px-4 py-2 text-body-md font-medium normal-case tracking-normal",
  default: "min-h-[var(--control-h-lg)] px-6 py-3.5 text-body-md font-medium normal-case tracking-normal",
  tall: "min-h-[var(--control-h-xl)] px-6 py-4 text-body-lg font-medium normal-case tracking-normal",
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
export const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-[8px] font-medium active:scale-[0.97]";

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

export interface ActionConfig {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

