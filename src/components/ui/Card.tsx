import type { HTMLAttributes } from "react";
import { cn, focusRing, interactiveMotion } from "./component-utils";

export type CardVariant = "default" | "compact" | "elevated";
export type CardElement = "article" | "section" | "div" | "li" | "button";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: CardElement;
  variant?: CardVariant;
  interactive?: boolean;
  selected?: boolean;
}

// Elevation tiers: surface tier + matching shadow. `elevated` lifts onto the
// raised surface (pure white in light) for genuine depth over warm paper.
const variantClasses: Record<CardVariant, string> = {
  default: "rounded-2xl p-4 bg-surface shadow-sm",
  compact: "rounded-xl p-3 bg-surface shadow-xs",
  elevated: "rounded-2xl p-4 bg-surface-elevated shadow-md"
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
        "border border-line text-ink",
        variantClasses[variant],
        selected && "border-[1.5px] border-accent bg-accent-soft",
        interactive &&
          cn(
            "cursor-pointer active:scale-[0.97] hover:-translate-y-px hover:border-accent/40 hover:shadow-hover",
            interactiveMotion,
            focusRing
          ),
        className
      )}
      {...props}
    />
  );
}

