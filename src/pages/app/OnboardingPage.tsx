import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useMyProfile } from "@/hooks/queries";
import { onboardingStore, ONBOARDING_STEPS } from "@/lib/stores/onboarding-store";
import { humanizeSnakeCase } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { StepProgress } from "@/components/ui/StepProgress";
import { OnboardingStepContent } from "@/components/onboarding/OnboardingStepContent";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();

  const currentStep = useStore(onboardingStore, (s) => s.currentStep);
  const stepKey = ONBOARDING_STEPS[currentStep];

  // Redirect to the step URL for deep linking
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate("/home", { replace: true });
    }
  }, [profile, navigate]);

  return (
    <div className="flex items-center justify-center p-4 md:p-6 min-h-[80vh]">
      <Card className="w-full max-w-md p-6">
        <StepProgress
          totalSteps={ONBOARDING_STEPS.length}
          currentStep={currentStep}
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
