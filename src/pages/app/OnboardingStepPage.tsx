import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useStore } from "zustand";
import { useMyProfile } from "@/hooks/queries";
import { onboardingStore, ONBOARDING_STEPS, type OnboardingStepKey } from "@/lib/stores/onboarding-store";
import { humanizeSnakeCase } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { StepProgress } from "@/components/ui/StepProgress";
import { OnboardingStepContent } from "@/components/onboarding/OnboardingStepContent";
import { OnboardingPhaseLabel } from "@/components/onboarding/OnboardingPhaseLabel";

export function OnboardingStepPage() {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const contentRef = useRef<HTMLDivElement>(null);

  // Resolve the requested step index from the URL param
  const stepIndex = ONBOARDING_STEPS.indexOf(step as OnboardingStepKey);
  const validStep = stepIndex >= 0 ? stepIndex : 0;

  // Sync the store from the URL on entry (deep-link). After that the store is
  // the source of truth: the wizard's Back/Next mutate the store, not the URL,
  // so we render from `currentStep` to keep the heading and nav in lockstep.
  // (The URL intentionally stays at the entry step; GateGuard only allows
  // /onboarding and /onboarding/:step is not a gate route.)
  useEffect(() => {
    if (onboardingStore.getState().currentStep !== validStep) {
      onboardingStore.getState().setStep(validStep);
    }
  }, [validStep]);

  const currentStep = useStore(onboardingStore, (s) => s.currentStep);
  const stepKey = ONBOARDING_STEPS[currentStep];

  // Redirect if onboarding already completed — side effect must be in useEffect
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate("/home", { replace: true });
    }
  }, [profile?.onboarding_completed, navigate]);

  // Move focus to the step content on step change for keyboard/SR users.
  useEffect(() => {
    contentRef.current?.focus();
  }, [currentStep]);

  // Don't render content if redirecting
  if (profile?.onboarding_completed) {
    return null;
  }

  return (
    <div className="flex items-center justify-center p-4 md:p-6 min-h-[80vh]">
      <Card className="w-full max-w-md p-6">
        <OnboardingPhaseLabel currentStep={currentStep} />
        <StepProgress
          totalSteps={ONBOARDING_STEPS.length}
          currentStep={currentStep}
          variant="linear"
          labels={ONBOARDING_STEPS.map(humanizeSnakeCase)}
        />
        <div ref={contentRef} tabIndex={-1} className="mt-6 outline-none">
          <OnboardingStepContent stepKey={stepKey} />
        </div>
      </Card>
    </div>
  );
}
