import { useId, type HTMLAttributes } from "react";
import { LayoutGroup, motion } from "framer-motion";
import { RadioGroup } from "radix-ui";
import { cn, focusRing, interactiveMotion } from "./component-utils";

export interface SegmentedControlOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "dir" | "defaultValue"> {
  options: SegmentedControlOption[];
  value: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
}

/**
 * One choice from a short set (a filter, a view, a period). A radio group:
 * one tab stop, arrow keys move and select. The raised sheet slides to the
 * chosen segment.
 */
export function SegmentedControl({ options, value, onValueChange, ariaLabel, className, ...props }: SegmentedControlProps) {
  const groupId = useId();
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onValueChange}
      aria-label={ariaLabel}
      orientation="horizontal"
      loop
      className={cn("relative inline-grid max-w-full auto-cols-fr grid-flow-col rounded-cut-md bg-surface-soft p-1", className)}
      {...props}
    >
      <LayoutGroup id={groupId}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <RadioGroup.Item
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={cn(
                "relative min-h-11 min-w-0 whitespace-nowrap rounded-cut-md px-4 text-body-md font-semibold disabled:cursor-not-allowed disabled:text-ink-4",
                interactiveMotion,
                focusRing,
                selected ? "text-ink" : "text-ink-3 hover:text-ink"
              )}
            >
              {selected ? (
                <motion.span
                  layoutId="segment"
                  aria-hidden="true"
                  className="absolute inset-0 rounded-cut-md bg-surface shadow-sm"
                  transition={{ type: "spring", stiffness: 520, damping: 38 }}
                />
              ) : null}
              <span className="relative">{option.label}</span>
            </RadioGroup.Item>
          );
        })}
      </LayoutGroup>
    </RadioGroup.Root>
  );
}
