import type { HTMLAttributes } from "react";
import { cn, focusRing, interactiveMotion } from "./component-utils";

export type CardVariant =
  | "default"
  | "compact"
  | "elevated"
  | "flat"
  | "media"
  | "stacked"
  | "promo"
  | "illustration";
export type CardElement = "article" | "section" | "div" | "li" | "button";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: CardElement;
  variant?: CardVariant;
  interactive?: boolean;
  selected?: boolean;
}

// Paper layers (DESIGN.md §4, §8): cards are grained paper-2 sheets with a
// hand-cut radius and a directional shadow; no hairline border.
const variantClasses: Record<CardVariant, string> = {
  default: "rounded-hand p-4 bg-surface paper-grain shadow-sm",
  compact: "rounded-[var(--radius-compact)] p-3 bg-surface shadow-xs",
  elevated: "rounded-hand p-4 bg-surface-elevated paper-grain shadow-md",
  flat: "rounded-hand p-4 bg-surface shadow-none",
  /* Photo-first cards: padding owned by children. */
  media: "rounded-hand p-0 bg-surface shadow-sm overflow-hidden",
  /* A sheet resting on a second sheet: one layer higher than default. */
  stacked: "rounded-hand p-4 bg-surface paper-grain shadow-md",
  promo: "rounded-[var(--radius-promo)] p-5 bg-paper-1 paper-grain shadow-none",
  illustration: "rounded-[var(--radius-promo)] p-5 bg-surface paper-grain shadow-xs"
};

export function Card({
  as: Component = "div",
  variant = "default",
  interactive = false,
  selected = false,
  className,
  tabIndex,
  ...props
}: CardProps) {
  return (
    <Component
      tabIndex={interactive && tabIndex === undefined ? 0 : tabIndex}
      className={cn(
        "text-ink",
        variantClasses[variant],
        selected && "bg-accent-soft ring-2 ring-accent",
        interactive &&
          cn("paper-lift cursor-pointer active:scale-[0.99]", interactiveMotion, focusRing),
        className
      )}
      {...props}
    />
  );
}
