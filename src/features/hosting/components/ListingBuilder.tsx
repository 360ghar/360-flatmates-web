import type { HTMLAttributes, ReactNode } from "react";
import { BottomActionBar } from "@/components/ui/Layout";
import { Button } from "@/components/ui/Button";
import { StepProgress } from "@/components/ui/StepProgress";
import { cn } from "@/components/ui/component-utils";

export interface ListingBuilderStep {
  id: string;
  label: string;
}

export interface ListingBuilderProps extends HTMLAttributes<HTMLElement> {
  steps: ListingBuilderStep[];
  currentStep: number;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSaveDraft?: () => void;
  nextLabel?: string;
  submitting?: boolean;
  nextDisabled?: boolean;
}

/** The post-a-listing wizard: one paper sheet per step, actions pinned below. */
export function ListingBuilder({
  steps,
  currentStep,
  children,
  onBack,
  onNext,
  onSaveDraft,
  nextLabel,
  submitting = false,
  nextDisabled = false,
  className,
  ...props
}: ListingBuilderProps) {
  const finalStep = currentStep >= steps.length - 1;

  return (
    <section className={cn("page-fade flex w-full flex-col", className)} {...props}>
      <div className="paper-grain rounded-hand bg-surface p-5 shadow-sm sm:p-7">
        <StepProgress
          aria-label="Listing progress"
          currentStep={currentStep}
          labels={steps.map((step) => step.label)}
          totalSteps={steps.length}
        />
        <div className="mt-6">{children}</div>
      </div>
      <BottomActionBar className="-mx-[var(--gutter)] mt-5 px-[var(--gutter)]">
        {onSaveDraft && finalStep ? (
          <Button variant="tertiary" onClick={onSaveDraft}>
            Save as draft
          </Button>
        ) : null}
        <Button variant="tertiary" onClick={onBack}>
          Back
        </Button>
        <Button loading={submitting} disabled={nextDisabled} onClick={onNext}>
          {nextLabel ?? (finalStep ? "Publish listing" : "Next")}
        </Button>
      </BottomActionBar>
    </section>
  );
}
