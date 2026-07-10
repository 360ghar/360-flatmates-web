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

// Elevation tiers: surface tier + matching shadow. `elevated` lifts onto the
// raised surface (pure white in light) for genuine depth over warm paper.
// `flat` is a plain surface panel with no border and no shadow.
// `stacked` uses an accent top border for a card-with-tab appearance.
const variantClasses: Record<CardVariant, string> = {
  /* ~14px cards (Airbnb soft property cards); border for rest state, shadow for lift */
  default: "rounded-[var(--radius-card)] p-4 bg-surface shadow-sm",
  compact: "rounded-[var(--radius-compact)] p-3 bg-surface shadow-xs",
  elevated: "rounded-[var(--radius-card)] p-4 bg-surface-elevated shadow-md",
  flat: "rounded-[var(--radius-card)] p-4 bg-surface border-0 shadow-none",
  /* Photo-first marketplace cards: padding owned by children, soft elevation */
  media: "rounded-[var(--radius-card)] p-0 bg-surface shadow-sm overflow-hidden",
  stacked: "rounded-[var(--radius-card)] p-4 bg-surface border-t-2 border-t-accent shadow-sm",
  promo: "rounded-[var(--radius-promo)] p-5 bg-lavender shadow-none",
  illustration: "rounded-[var(--radius-promo)] p-5 bg-surface shadow-xs"
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
  const noBorder = variant === "flat";
  return (
    <Component
      tabIndex={interactive && tabIndex === undefined ? 0 : tabIndex}
      className={cn(
        "text-ink",
        !noBorder && "border border-line",
        variantClasses[variant],
        selected && "border-[1.5px] border-accent bg-accent-soft",
        interactive &&
        cn(
          "cursor-pointer active:scale-[0.97] hover:-translate-y-px hover:shadow-hover",
          // media cards already own shadow; border hover still helps non-media
          variant !== "media" && "hover:border-accent/40",
          interactiveMotion,
          focusRing
        ),
        className
      )}
      {...props}
    />
  );
}
