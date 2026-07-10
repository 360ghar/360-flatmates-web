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

/** Elevation tiers: surface tier + shadow. Pair with `bg-surface`/`bg-surface-raised`. */
export const elevation = {
  flat: "shadow-xs",
  raised: "shadow-sm",
  overlay: "shadow-md",
  modal: "shadow-lg"
} as const;

/** Canonical interactive control heights (all ≥ the 44px touch-target minimum where tappable). */
export const controlHeight = {
  sm: "min-h-[var(--control-h-sm)]",
  md: "min-h-[var(--control-h-md)]",
  lg: "min-h-[var(--control-h-lg)]",
  xl: "min-h-[var(--control-h-xl)]"
} as const;

export interface ActionConfig {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

