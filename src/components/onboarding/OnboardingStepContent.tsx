import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useMyProfile, useCreateProfile, useUpdateProfile } from "@/hooks/queries";
import { onboardingStore, ONBOARDING_STEPS, type OnboardingStepKey } from "@/lib/stores/onboarding-store";
import { authStore } from "@/lib/stores/auth-store";
import { searchStore } from "@/lib/stores/search-store";
import { uiStore } from "@/lib/stores/ui-store";
import {
  completedOnboardingSchema,
  onboardingBasicInfoSchema,
  onboardingBudgetTimelineSchema,
  onboardingLocationSchema,
  type OnboardingDraft,
} from "@/lib/schemas/onboarding";
import { lifestyleSchema } from "@/lib/schemas/profile";
import { Button } from "@/components/ui/Button";
import { OnboardingSplashStep } from "./OnboardingSplashStep";
import { OnboardingModeStep } from "./OnboardingModeStep";
import { OnboardingLocationStep } from "./OnboardingLocationStep";
import { OnboardingBasicInfoStep } from "./OnboardingBasicInfoStep";
import { OnboardingProfilePhotoStep } from "./OnboardingProfilePhotoStep";
import { OnboardingLifestyleStep } from "./OnboardingLifestyleStep";
import { OnboardingSmokingGuestsStep } from "./OnboardingSmokingGuestsStep";
import { OnboardingWorkStyleStep } from "./OnboardingWorkStyleStep";
import { OnboardingBudgetTimelineStep } from "./OnboardingBudgetTimelineStep";
import { OnboardingPreferencesStep } from "./OnboardingPreferencesStep";

interface OnboardingStepContentProps {
  stepKey: OnboardingStepKey;
}

function buildFinalDraft(draft: OnboardingDraft): OnboardingDraft {
  return {
    ...draft,
    mode: draft.mode ?? "open_to_both",
    preferences: {
      gender_preference: draft.preferences?.gender_preference ?? "any",
      non_negotiables: draft.preferences?.non_negotiables ?? [],
    },
  };
}

function validateVisibleStep(stepKey: OnboardingStepKey, draft: OnboardingDraft) {
  const finalDraft = buildFinalDraft(draft);

  switch (stepKey) {
    case "splash":
    case "mode":
    case "profile_photo":
    case "preferences":
      return { success: true as const };
    case "location":
      return onboardingLocationSchema.safeParse(finalDraft.location);
    case "basic_info":
      return onboardingBasicInfoSchema.safeParse(finalDraft.basic_info);
    case "lifestyle":
      return lifestyleSchema
        .pick({ sleep_schedule: true, cleanliness: true, food_habits: true })
        .safeParse(finalDraft.lifestyle);
    case "smoking_guests":
      return lifestyleSchema
        .pick({ smoking_drinking: true, guests_policy: true })
        .safeParse(finalDraft.lifestyle);
    case "work_style":
      return lifestyleSchema.pick({ work_style: true }).safeParse(finalDraft.lifestyle);
    case "budget_timeline":
      return onboardingBudgetTimelineSchema.safeParse(finalDraft.budget_timeline);
    default:
      return { success: true as const };
  }
}

function validationMessageForStep(stepKey: OnboardingStepKey): string {
  switch (stepKey) {
    case "location":
      return "Add your city before continuing.";
    case "basic_info":
      return "Add your name, age, and profession before continuing.";
    case "lifestyle":
      return "Choose your sleep schedule, cleanliness, and food habits.";
    case "smoking_guests":
      return "Choose your smoking/drinking and guests preferences.";
    case "work_style":
      return "Choose your work style before continuing.";
    case "budget_timeline":
      return "Add a valid budget range and move-in timeline.";
    default:
      return "Complete this step before continuing.";
  }
}

export function OnboardingStepContent({ stepKey }: OnboardingStepContentProps) {
  const navigate = useNavigate();
  const updateProfile = useUpdateProfile();
  const createProfile = useCreateProfile();
  const { data: profile } = useMyProfile();

  const draft = useStore(onboardingStore, (s) => s.draft);
  const currentStep = useStore(onboardingStore, (s) => s.currentStep);
  const patchDraft = useStore(onboardingStore, (s) => s.patchDraft);
  const nextStep = useStore(onboardingStore, (s) => s.nextStep);
  const previousStep = useStore(onboardingStore, (s) => s.previousStep);
  const setStep = useStore(onboardingStore, (s) => s.setStep);

  function goNext() {
    const stepValidation = validateVisibleStep(stepKey, draft);
    if (!stepValidation.success) {
      uiStore.getState().pushToast({
        type: "error",
        title: "Step incomplete",
        description: validationMessageForStep(stepKey),
      });
      return;
    }

    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      const finalDraft = buildFinalDraft(draft);
      const completed = completedOnboardingSchema.safeParse(finalDraft);
      if (!completed.success) {
        uiStore.getState().pushToast({
          type: "error",
          title: "Profile incomplete",
          description: "Review the previous steps and complete the missing details.",
        });
        return;
      }

      const payload = {
        mode: completed.data.mode,
        full_name: completed.data.basic_info.full_name,
        age: completed.data.basic_info.age,
        profession: completed.data.basic_info.profession,
        city: completed.data.location.city,
        locality: completed.data.location.locality,
        profile_image_url: completed.data.profile_image_url,
        ...completed.data.lifestyle,
        budget_min: completed.data.budget_timeline.budget_min,
        budget_max: completed.data.budget_timeline.budget_max,
        move_in_timeline: completed.data.budget_timeline.move_in_timeline,
        gender_preference: completed.data.preferences.gender_preference,
        preferences: {
          non_negotiables: completed.data.preferences.non_negotiables,
        },
        onboarding_completed: true
      };

      const onProfileSaved = () => {
        searchStore.getState().setFilters({
          city: draft.location?.city,
          locality: draft.location?.locality,
          price_min: draft.budget_timeline?.budget_min,
          price_max: draft.budget_timeline?.budget_max,
        });
        onboardingStore.getState().clearDraft();
        // Advance authStage before navigating so GateGuard does not bounce
        // the user back to /onboarding.
        authStore.getState().setAuthStage("active");
        navigate("/home");
      };

      const onProfileError = (err: unknown) => {
        const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
        uiStore.getState().pushToast({
          type: "error",
          title: "Couldn't save your profile",
          description: message,
        });
      };

      if (profile) {
        updateProfile.mutate(payload, { onSuccess: onProfileSaved, onError: onProfileError });
      } else {
        createProfile.mutate(payload, { onSuccess: onProfileSaved, onError: onProfileError });
      }
    } else {
      nextStep();
    }
  }

  function goBack() {
    if (currentStep > 0) {
      previousStep();
    }
  }

  function goStartOver() {
    // Wipe the persisted draft + step counter. The user is bounced back to the
    // splash step so they re-walk the wizard from scratch. Mirrors the
    // `clearDraft` action used at the end of a successful onboarding.
    onboardingStore.getState().clearDraft();
    setStep(0);
  }

  const submitting = updateProfile.isPending || createProfile.isPending;
  // `isLastStep` is gated on the *step we're actually rendering*, not the
  // raw `currentStep` index. A deep-link to /onboarding/splash that mutated
  // `currentStep` to 9 (clamped by the store) would otherwise render the
  // "Complete Setup" label on the splash step. By deriving from `stepKey`
  // we always show the right affordance for what the user sees.
  const isLastStep = stepKey === ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1];
  const isSplashStep = stepKey === "splash";
  const canContinue = validateVisibleStep(stepKey, draft).success;

  return (
    <div className="flex flex-col gap-5">
      {stepKey === "splash" && <OnboardingSplashStep />}

      {stepKey === "mode" && (
        <OnboardingModeStep mode={draft.mode ?? "open_to_both"} patchDraft={patchDraft} />
      )}

      {stepKey === "location" && (
        <OnboardingLocationStep location={draft.location} patchDraft={patchDraft} />
      )}

      {stepKey === "basic_info" && (
        <OnboardingBasicInfoStep basicInfo={draft.basic_info} patchDraft={patchDraft} />
      )}

      {stepKey === "profile_photo" && (
        <OnboardingProfilePhotoStep
          fullName={draft.basic_info?.full_name}
          profileImageUrl={draft.profile_image_url}
          patchDraft={patchDraft}
        />
      )}

      {stepKey === "lifestyle" && (
        <OnboardingLifestyleStep lifestyle={draft.lifestyle} patchDraft={patchDraft} />
      )}

      {stepKey === "smoking_guests" && (
        <OnboardingSmokingGuestsStep lifestyle={draft.lifestyle} patchDraft={patchDraft} />
      )}

      {stepKey === "work_style" && (
        <OnboardingWorkStyleStep lifestyle={draft.lifestyle} patchDraft={patchDraft} />
      )}

      {stepKey === "budget_timeline" && (
        <OnboardingBudgetTimelineStep budgetTimeline={draft.budget_timeline} patchDraft={patchDraft} />
      )}

      {stepKey === "preferences" && (
        <OnboardingPreferencesStep preferences={draft.preferences} patchDraft={patchDraft} />
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3 mt-4">
        {currentStep > 0 && (
          <Button variant="tertiary" onClick={goBack}>
            Back
          </Button>
        )}
        <Button
          fullWidth
          loading={submitting}
          onClick={goNext}
          disabled={submitting || !canContinue}
          aria-label={isSplashStep ? "Get started" : undefined}
        >
          {isLastStep ? "Complete Setup" : isSplashStep ? "Get started" : "Next"}
        </Button>
      </div>

      {/* "Start over" affordance: visible from step 1+ (the splash is the
          starting point, so re-starting from it is a no-op). Wired to the
          store-level `clearDraft` so a partial draft doesn't linger in
          localStorage after the user bails. */}
      {currentStep > 0 && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={goStartOver}
            className="text-caption text-ink-3 hover:text-accent transition-colors"
          >
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
