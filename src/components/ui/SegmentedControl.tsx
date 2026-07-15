import { useCallback, useRef, type HTMLAttributes } from "react";
import { LazyMotion, domMax, m } from "framer-motion";
import { useStore } from "zustand";
import { cn, focusRing, interactiveMotion } from "./component-utils";
import { uiStore } from "@/lib/stores/ui-store";

export interface SegmentedControlOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: SegmentedControlOption[];
  value: string;
  onValueChange?: (value: string) => void;
  ariaLabel?: string;
}

export function SegmentedControl({
  options,
  value,
  onValueChange,
  ariaLabel,
  className,
  ...props
}: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useStore(uiStore, (s) => s.reducedMotion);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = options.findIndex((o) => o.value === value);
      let nextIndex = -1;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % options.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + options.length) % options.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = options.length - 1;
      } else if (e.key === "Enter" || e.key === " ") {
        const target = e.target as HTMLElement;
        const idx = Number(target.dataset.index);
        if (Number.isInteger(idx) && idx >= 0 && idx < options.length) {
          e.preventDefault();
          const nextOption = options[idx];
          if (!nextOption.disabled) {
            onValueChange?.(nextOption.value);
          }
        }
        return;
      }

      if (nextIndex >= 0 && nextIndex < options.length) {
        const nextOption = options[nextIndex];
        if (!nextOption.disabled) {
          onValueChange?.(nextOption.value);
          const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>("button[data-index]");
          buttons?.[nextIndex]?.focus();
        }
      }
    },
    [options, value, onValueChange]
  );

  return (
    <LazyMotion features={domMax}>
      <div
        ref={containerRef}
        role="tablist"
        aria-label={ariaLabel}
        className={cn("relative inline-flex min-h-11 rounded-full bg-paper-2 p-1", className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {options.map((option, index) => {
          const selected = option.value === value;

          return (
            <button
              type="button"
              role="tab"
              tabIndex={selected ? 0 : -1}
              aria-selected={selected}
              disabled={option.disabled}
              data-index={index}
              className={cn(
                "relative z-10 min-h-9 rounded-full px-4 text-body-md font-semibold disabled:cursor-not-allowed disabled:text-ink-4",
                interactiveMotion,
                focusRing,
                selected ? "text-ink" : "text-ink-3 hover:text-ink",
              )}
              key={option.value}
              onClick={() => onValueChange?.(option.value)}
            >
              {selected ? (
                <m.span
                  layoutId="segmented-indicator"
                  className="absolute inset-0 -z-10 rounded-full bg-surface shadow-xs"
                  transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 35 }}
                />
              ) : null}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </LazyMotion>
  );
}

