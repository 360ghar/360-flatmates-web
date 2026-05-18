import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useMyProfile } from "@/hooks/queries";
import { onboardingStore, ONBOARDING_STEPS, type OnboardingStepKey } from "@/lib/stores/onboarding-store";
import { humanizeSnakeCase } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { StepProgress } from "@/components/ui/StepProgress";
import { OnboardingStepContent } from "@/components/onboarding/OnboardingStepContent";

export function OnboardingStepPage() {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();

  // Resolve step index from URL param
  const stepIndex = ONBOARDING_STEPS.indexOf(step as OnboardingStepKey);
  const validStep = stepIndex >= 0 ? stepIndex : 0;
  const stepKey = ONBOARDING_STEPS[validStep];

  // Sync store with URL — must be in useEffect, not during render
  useEffect(() => {
    if (onboardingStore.getState().currentStep !== validStep) {
      onboardingStore.getState().setStep(validStep);
    }
  }, [validStep]);

  // Redirect if onboarding already completed — side effect must be in useEffect
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate("/home", { replace: true });
    }
  }, [profile?.onboarding_completed, navigate]);

  // Don't render content if redirecting
  if (profile?.onboarding_completed) {
    return null;
  }

  return (
    <div className="flex items-center justify-center p-4 md:p-6 min-h-[80vh]">
      <Card className="w-full max-w-md p-6">
        <StepProgress
          totalSteps={ONBOARDING_STEPS.length}
          currentStep={validStep}
          variant="linear"
          labels={ONBOARDING_STEPS.map(humanizeSnakeCase)}
        />
        <div className="mt-6">
          <OnboardingStepContent stepKey={stepKey} />
        </div>
      </Card>
    </div>
  );
}
