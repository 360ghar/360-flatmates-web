import type { ButtonHTMLAttributes } from "react";
import { cn, focusRing, interactiveMotion } from "./component-utils";

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  /** Whether the toggle is currently on */
  checked: boolean;
  /** Callback when the toggle value changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible label for the toggle */
  label?: string;
  /** Disable the toggle */
  disabled?: boolean;
}

export function Toggle({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
  ...props
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        interactiveMotion,
        focusRing,
        checked ? "bg-accent" : "bg-paper-3",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-[22px] w-[22px] rounded-full bg-surface-elevated shadow-sm ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-[22px]" : "translate-x-0"
        )}
      />
    </button>
  );
}
