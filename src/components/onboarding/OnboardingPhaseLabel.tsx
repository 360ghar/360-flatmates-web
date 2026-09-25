import { ONBOARDING_PHASES, phaseForStep } from "@/lib/stores/onboarding-store";

/** "Phase 1 of 2 · Your Information" header above the wizard progress bar. */
export function OnboardingPhaseLabel({ currentStep }: { currentStep: number }) {
  const phase = phaseForStep(currentStep);
  return (
    <p className="text-label-md font-semibold text-accent">
      Phase {phase.index} of {ONBOARDING_PHASES.length} · {phase.label}
    </p>
  );
}
