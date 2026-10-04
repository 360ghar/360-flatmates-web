import type { HTMLAttributes } from "react";
import { cn } from "./component-utils";

export type StepProgressVariant = "segments" | "linear";

export interface StepProgressProps extends HTMLAttributes<HTMLDivElement> {
  totalSteps: number;
  currentStep: number;
  variant?: StepProgressVariant;
  /** Step names; the current one is shown next to the count. */
  labels?: string[];
  /** Accessible name for the progress bar (e.g. "Onboarding progress"). */
  "aria-label"?: string;
  /** Custom accessible value text (e.g. "Step 3 of 10"). */
  "aria-valuetext"?: string;
}

/**
 * Where the user is in a multi-step flow: a bar (one segment per step, or one
 * continuous track) and one line "Step 3 of 8: Location". Fills animate
 * width inside a clipped rounded track, so the caps never change shape.
 */
export function StepProgress({
  totalSteps,
  currentStep,
  variant = "segments",
  labels,
  className,
  "aria-label": ariaLabel,
  "aria-valuetext": ariaValueText,
  ...props
}: StepProgressProps) {
  const total = Math.max(1, totalSteps);
  const current = Math.min(Math.max(currentStep, 0), total - 1);
  const label = labels?.[current];
  const valueText = ariaValueText ?? `Step ${current + 1} of ${total}${label ? `: ${label}` : ""}`;

  return (
    <div className={cn("flex w-full flex-col gap-2.5", className)} {...props}>
      <div
        role="progressbar"
        aria-label={ariaLabel ?? "Progress"}
        aria-valuenow={current + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuetext={valueText}
        className={cn("flex items-center", variant === "segments" ? "gap-1" : "")}
      >
        {variant === "linear" ? (
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-strong">
            <span
              className="block h-full bg-clay transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-paper-out)] motion-reduce:transition-none"
              style={{ width: `${((current + 1) / total) * 100}%` }}
            />
          </span>
        ) : (
          Array.from({ length: total }, (_, index) => (
            <span key={index} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-strong">
              <span
                className={cn(
                  "block h-full bg-clay transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-paper-out)] motion-reduce:transition-none",
                  index < current ? "w-full" : index === current ? "w-1/2" : "w-0"
                )}
              />
            </span>
          ))
        )}
      </div>
      <p className="text-caption text-ink-3" aria-hidden="true">
        Step {current + 1} of {total}
        {label ? <span className="font-semibold text-ink">: {label}</span> : null}
      </p>
    </div>
  );
}
