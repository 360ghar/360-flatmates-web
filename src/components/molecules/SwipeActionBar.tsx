import type { HTMLAttributes } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Heart, Star, X } from "lucide-react";
import { cn, focusRing, interactiveMotion } from "../ui/component-utils";

export interface SwipeActionBarProps extends HTMLAttributes<HTMLDivElement> {
  onPass?: () => void;
  onSuperLike?: () => void;
  onLike?: () => void;
  disabled?: boolean;
}

export function SwipeActionBar({
  onPass,
  onSuperLike,
  onLike,
  disabled = false,
  className,
  ...props
}: SwipeActionBarProps) {
  const prefersReducedMotion = useReducedMotion() === true;

  const hoverScale = prefersReducedMotion ? undefined : { scale: 1.05 };
  const tapScale = prefersReducedMotion ? undefined : { scale: 0.9 };

  return (
    <div className={cn("flex items-center justify-center gap-5", className)} {...props}>
      <m.button
        type="button"
        aria-label="Pass"
        disabled={disabled}
        className={cn(
          "flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-error/30 bg-error-soft text-error disabled:border-line disabled:bg-paper-4 disabled:text-ink-4",
          interactiveMotion,
          focusRing
        )}
        onClick={onPass}
        whileHover={hoverScale}
        whileTap={tapScale}
      >
        <X aria-hidden="true" className="h-6 w-6" />
      </m.button>
      <m.button
        type="button"
        aria-label="Super Like"
        disabled={disabled}
        className={cn(
          "flex h-[50px] w-[50px] items-center justify-center rounded-full border-2 border-warning/30 bg-warning-soft text-warning disabled:border-line disabled:bg-paper-4 disabled:text-ink-4",
          interactiveMotion,
          focusRing
        )}
        onClick={onSuperLike}
        whileHover={hoverScale}
        whileTap={tapScale}
      >
        <Star aria-hidden="true" className="h-5 w-5" />
      </m.button>
      <m.button
        type="button"
        aria-label="Like"
        disabled={disabled}
        className={cn(
          "flex h-[60px] w-[60px] items-center justify-center rounded-full border-2 border-success/30 bg-success-soft text-success disabled:border-line disabled:bg-paper-4 disabled:text-ink-4",
          interactiveMotion,
          focusRing
        )}
        onClick={onLike}
        whileHover={hoverScale}
        whileTap={tapScale}
      >
        <Heart aria-hidden="true" className="h-6 w-6" />
      </m.button>
    </div>
  );
}
