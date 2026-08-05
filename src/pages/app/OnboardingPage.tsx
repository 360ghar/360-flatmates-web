import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useMyProfile } from "@/hooks/queries";
import { onboardingStore, ONBOARDING_STEPS } from "@/lib/stores/onboarding-store";
import { humanizeSnakeCase } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { StepProgress } from "@/components/ui/StepProgress";
import { OnboardingStepContent } from "@/components/onboarding/OnboardingStepContent";
import { OnboardingPhaseLabel } from "@/components/onboarding/OnboardingPhaseLabel";

export function OnboardingPage() {
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();

  const currentStep = useStore(onboardingStore, (s) => s.currentStep);
  const stepKey = ONBOARDING_STEPS[currentStep];
  const contentRef = useRef<HTMLDivElement>(null);

  // The wizard advances by mutating the store (not the URL), so this route
  // stays at /onboarding. The /onboarding/:step route is the deep-link entry
  // that syncs the URL back into the store.
  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate("/home", { replace: true });
    }
  }, [profile, navigate]);

  // Move focus to the step content when the step changes so keyboard and
  // screen-reader users land on the new question instead of staying on the
  // navigation button they just activated.
  useEffect(() => {
    contentRef.current?.focus();
  }, [currentStep]);

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
