import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useStore } from "zustand";
import { useMyProfile } from "@/hooks/queries/useProfiles";
import { onboardingStore, ONBOARDING_STEPS, type OnboardingStepKey } from "@/features/onboarding/store";
import { StepProgress } from "@/components/ui/StepProgress";
import { OnboardingStepContent } from "@/features/onboarding/components/OnboardingStepContent";

const STEP_LABELS: Record<OnboardingStepKey, string> = {
  splash: "Welcome",
  mode: "How you use 360",
  location: "Where you live",
  basic_info: "About you",
  profile_photo: "Photo",
  phase_transition: "Your preferences",
  lifestyle: "Lifestyle",
  smoking_drinking: "Smoking and drinking",
  guests: "Guests",
  work_style: "Work",
  budget_timeline: "Budget and move-in",
  preferences: "Flatmate preferences"
};

/**
 * The onboarding wizard. `/onboarding/:step` is a deep link that seeds the
 * store once; after that the store drives Back/Next and the URL stays put
 * (GateGuard only lets /onboarding through).
 */
export function OnboardingPage() {
  const { step } = useParams<{ step?: string }>();
  const navigate = useNavigate();
  const { data: profile } = useMyProfile();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!step) return;
    const index = ONBOARDING_STEPS.indexOf(step as OnboardingStepKey);
    onboardingStore.getState().setStep(index >= 0 ? index : 0);
  }, [step]);

  const currentStep = useStore(onboardingStore, (s) => s.currentStep);
  const stepKey = ONBOARDING_STEPS[currentStep];

  useEffect(() => {
    if (profile?.onboarding_completed) navigate("/home", { replace: true });
  }, [profile?.onboarding_completed, navigate]);

  // Move focus to the new question so keyboard and screen-reader users follow.
  useEffect(() => {
    contentRef.current?.focus();
  }, [currentStep]);

  if (profile?.onboarding_completed) return null;

  return (
    <div className="page-fade paper-grain rounded-hand bg-surface p-6 shadow-sm sm:p-8">
      <StepProgress
        aria-label="Onboarding progress"
        totalSteps={ONBOARDING_STEPS.length}
        currentStep={currentStep}
        labels={ONBOARDING_STEPS.map((key) => STEP_LABELS[key])}
      />
      <div ref={contentRef} tabIndex={-1} className="mt-6 outline-none">
        <OnboardingStepContent stepKey={stepKey} />
      </div>
    </div>
  );
}
