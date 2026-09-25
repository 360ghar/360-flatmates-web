import type { HTMLAttributes } from "react";
import { cn } from "./component-utils";

export type StepProgressVariant = "dots" | "segments" | "linear";

export interface StepProgressProps extends HTMLAttributes<HTMLDivElement> {
  totalSteps: number;
  currentStep: number;
  variant?: StepProgressVariant;
  labels?: string[];
  /** Accessible name for the progress bar (e.g. "Onboarding progress"). */
  "aria-label"?: string;
  /** Custom accessible value text (e.g. "Step 3 of 10"). */
  "aria-valuetext"?: string;
}

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
  const safeTotal = Math.max(1, totalSteps);
  const safeCurrent = Math.min(Math.max(currentStep, 0), safeTotal - 1);
  const percentage = ((safeCurrent + 1) / safeTotal) * 100;

  if (variant === "linear") {
    return (
      <div
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={safeCurrent + 1}
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-valuetext={ariaValueText}
        className={cn("flex w-full flex-col gap-2", className)}
        {...props}
      >
        <div className="h-1 overflow-hidden rounded-full bg-surface-strong">
          <div className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out" style={{ width: `${percentage}%` }} />
        </div>
        {labels?.length ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {labels.slice(0, safeTotal).map((label, index) => (
              <span
                key={label}
                className={cn(
                  "text-caption",
                  index === safeCurrent ? "font-semibold text-ink" : "text-ink-3"
                )}
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={safeCurrent + 1}
      aria-valuemin={1}
      aria-valuemax={safeTotal}
      aria-valuetext={ariaValueText}
      className={cn("flex w-full flex-col gap-2", className)}
      {...props}
    >
      <div className={cn("flex items-center", variant === "dots" ? "gap-1.5" : "gap-1")}>
        {Array.from({ length: safeTotal }, (_, index) => {
          const completed = index < safeCurrent;
          const current = index === safeCurrent;

          if (variant === "dots") {
            return (
              <span className="flex flex-1 items-center gap-1.5" key={index}>
                <span
                  className={cn(
                    "h-2 w-2 rounded-full border",
                    completed && "border-accent bg-accent",
                    current && "border-accent bg-surface",
                    !completed && !current && "border-ink-4 bg-ink-4"
                  )}
                />
                {index < safeTotal - 1 ? <span className={cn("h-0.5 flex-1", completed ? "bg-accent" : "bg-ink-4")} /> : null}
              </span>
            );
          }

          return (
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-ink-4" key={index}>
              <span
                className={cn("block h-full bg-accent transition-[width] duration-200 ease-out", completed ? "w-full" : current ? "w-1/2" : "w-0")}
              />
            </span>
          );
        })}
      </div>
      {labels?.length ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {labels.slice(0, safeTotal).map((label, index) => (
            <span
              key={label}
              className={cn(
                "text-caption",
                index === safeCurrent ? "font-semibold text-ink" : "text-ink-3"
              )}
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
