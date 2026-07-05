import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { Camera, Crosshair, Loader2 } from "lucide-react";
import { useMyProfile, useCreateProfile, useUpdateProfile, useReverseGeocode } from "@/hooks/queries";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
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
import { FLATMATE_MODE_OPTIONS, type FlatmatesMode } from "@/lib/data";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Avatar } from "@/components/ui/Avatar";
import type { SleepSchedule, Cleanliness, FoodHabits, SmokingDrinking, GuestsPolicy, WorkStyle, MoveInTimeline, GenderPreference } from "@/lib/data";
import { humanizeSnakeCase } from "@/lib/utils";

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

function numberOrUndefined(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
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

  const { upload: uploadImage } = useAvatarUpload();
  const { geocode, geoLoading } = useReverseGeocode();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  // Tracks the active object URL so we can revoke it on swap/unmount to avoid
  // leaking blob: URLs. Null when the current preview is a hosted URL (or none).
  const objectUrlRef = useRef<string | null>(null);

  // Revoke any outstanding object URL when the component unmounts.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      uiStore.getState().pushToast({
        type: "error",
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const result = await geocode(latitude, longitude);

          if (result.city) {
            patchDraft({
              location: {
                ...draft.location,
                city: result.city,
                locality: result.locality || draft.location?.locality,
                lat: latitude,
                lng: longitude,
              },
            });
          } else {
            uiStore.getState().pushToast({
              type: "error",
              title: "Could not determine city",
              description: "We couldn't find a city name for your location.",
            });
          }
        } catch {
          uiStore.getState().pushToast({
            type: "error",
            title: "Reverse geocoding failed",
            description: "Could not resolve your location to a city.",
          });
        }
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Please enable it in your browser settings."
            : "Could not get your location. Please try again.";
        uiStore.getState().pushToast({
          type: "error",
          title: "Location unavailable",
          description: message,
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [draft.location, patchDraft, geocode]);

  const handlePhotoSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so re-picking the same file (e.g. after a failure) fires again.
      e.target.value = "";
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        uiStore.getState().pushToast({
          type: "error",
          title: "Unsupported file",
          description: "Please choose an image file.",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        uiStore.getState().pushToast({
          type: "error",
          title: "Image too large",
          description: "Please choose an image under 5 MB.",
        });
        return;
      }

      // Show an instant local preview so the user gets visual feedback before
      // the (possibly slow or missing) upload round-trip completes.
      const localPreview = URL.createObjectURL(file);
      // Revoke the previous object URL (if any) before replacing it.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = localPreview;
      setPhotoPreview(localPreview);

      setPhotoUploading(true);
      try {
        const publicUrl = await uploadImage(file);
        // Swap the local preview for the hosted URL and release the blob.
        if (objectUrlRef.current === localPreview) {
          URL.revokeObjectURL(localPreview);
          objectUrlRef.current = null;
        }
        setPhotoPreview(publicUrl);
        patchDraft({ profile_image_url: publicUrl });
        uiStore.getState().pushToast({
          type: "success",
          title: "Photo uploaded",
        });
      } catch (err) {
        // Keep the local object URL preview so the user still sees their
        // selection. Do NOT patch the draft with a hosted URL — the upload
        // didn't succeed, so profile_image_url stays as-is and the user can
        // retry. The error toast carries the friendly message.
        const description =
          err instanceof Error ? err.message : "Could not upload your photo. Please try again.";
        uiStore.getState().pushToast({
          type: "error",
          title: "Upload failed",
          description,
        });
      } finally {
        setPhotoUploading(false);
      }
    },
    [uploadImage, patchDraft]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
      {stepKey === "splash" && (
        <>
          <h2 className="text-h2 text-center">Welcome to 360 Flatmates</h2>
          <p className="text-body-md text-ink-2 text-center">
            Find your perfect flatmate or list your room. Let us set up your profile.
          </p>
        </>
      )}

      {stepKey === "mode" && (
        <>
          <h2 className="text-h2">How will you use 360 Flatmates?</h2>
          <SegmentedControl
            options={[...FLATMATE_MODE_OPTIONS]}
            value={draft.mode ?? "open_to_both"}
            onValueChange={(value) =>
              patchDraft({ mode: value as FlatmatesMode })
            }
            ariaLabel="Select your mode"
          />
        </>
      )}

      {stepKey === "location" && (
        <>
          <h2 className="text-h2">Where are you looking?</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  label="City"
                  placeholder="City (e.g. Gurugram)"
                  value={draft.location?.city ?? ""}
                  onChange={(e) =>
                    patchDraft({ location: { ...draft.location, city: e.target.value } })
                  }
                />
              </div>
              <button
                type="button"
                className="flex h-12 items-center gap-1.5 rounded-[9px] border border-line bg-surface px-3 text-label-md text-accent transition-colors hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                aria-label="Use my current location"
              >
                {geoLoading ? (
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair aria-hidden="true" className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {geoLoading ? "Detecting..." : "Locate"}
                </span>
              </button>
            </div>
            <Input
              label="Locality"
              placeholder="Locality (e.g. DLF Phase 1)"
              value={draft.location?.locality ?? ""}
              onChange={(e) =>
                patchDraft({ location: { ...draft.location, locality: e.target.value } })
              }
            />
          </div>
        </>
      )}

      {stepKey === "basic_info" && (
        <>
          <h2 className="text-h2">Tell us about yourself</h2>
          <div className="flex flex-col gap-3">
            <Input
              label="Full name"
              placeholder="Full name"
              value={draft.basic_info?.full_name ?? ""}
              onChange={(e) =>
                patchDraft({
                  basic_info: { ...draft.basic_info, full_name: e.target.value }
                })
              }
            />
            <Input
              label="Age"
              type="number"
              placeholder="Age"
              value={draft.basic_info?.age ? String(draft.basic_info.age) : ""}
              onChange={(e) => {
                // Guard against `Number("") === 0` and `Number("abc") === NaN`.
                // An empty input means "no value yet" — keep the field
                // undefined so the optional-age validation stays honest.
                const raw = e.target.value;
                if (raw === "") {
                  patchDraft({
                    basic_info: { ...draft.basic_info, age: undefined }
                  });
                  return;
                }
                const parsed = Number(raw);
                if (!Number.isFinite(parsed)) return;
                patchDraft({
                  basic_info: { ...draft.basic_info, age: parsed }
                });
              }}
            />
            <Input
              label="Profession"
              placeholder="Profession"
              value={draft.basic_info?.profession ?? ""}
              onChange={(e) =>
                patchDraft({
                  basic_info: { ...draft.basic_info, profession: e.target.value }
                })
              }
            />
          </div>
        </>
      )}

      {stepKey === "profile_photo" && (
        <>
          <h2 className="text-h2">Add a profile photo</h2>
          <p className="text-body-md text-ink-2">
            Profiles with photos get 3x more responses. You can add or change it later.
          </p>
          <div className="flex flex-col items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="sr-only"
              aria-label="Choose profile photo"
            />
            <Avatar
              name={draft.basic_info?.full_name ?? "You"}
              size="xl"
              src={photoPreview ?? draft.profile_image_url ?? null}
              editable
              onEdit={openFilePicker}
            />
            <Button
              variant="secondary"
              onClick={openFilePicker}
              loading={photoUploading}
              disabled={photoUploading}
              leadingIcon={<Camera aria-hidden="true" className="h-4 w-4" />}
            >
              {photoUploading
                ? "Uploading..."
                : photoPreview || draft.profile_image_url
                  ? "Change Photo"
                  : "Choose Photo"}
            </Button>
          </div>
        </>
      )}

      {stepKey === "lifestyle" && (
        <>
          <h2 className="text-h2">Your lifestyle</h2>
            <div className="flex flex-col gap-4">
            <div>
              <p className="text-label-md text-ink-2 mb-2">Sleep Schedule</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Sleep schedule">
                {(["early_bird", "flexible", "night_owl"] as const).map((val) => (
                  <Chip
                    variant="choice"
                    key={val}
                    selected={draft.lifestyle?.sleep_schedule === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, sleep_schedule: val as SleepSchedule } })
                    }
                  >
                    {humanizeSnakeCase(val)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label-md text-ink-2 mb-2">Cleanliness</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cleanliness">
                {(["minimal", "tidy", "spotless"] as const).map((val) => (
                  <Chip
                    variant="choice"
                    key={val}
                    selected={draft.lifestyle?.cleanliness === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, cleanliness: val as Cleanliness } })
                    }
                  >
                    {val}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label-md text-ink-2 mb-2">Food Habits</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Food habits">
                {(["vegetarian", "vegan", "non_vegetarian", "eggetarian", "no_preference"] as const).map((val) => (
                  <Chip
                    variant="choice"
                    key={val}
                    selected={draft.lifestyle?.food_habits === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, food_habits: val as FoodHabits } })
                    }
                  >
                    {humanizeSnakeCase(val)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {stepKey === "smoking_guests" && (
        <>
          <h2 className="text-h2">Smoking & Guests</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-label-md text-ink-2 mb-2">Smoking / Drinking</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Smoking and drinking">
                {(["neither", "smoke_outside", "drink_occasionally", "both_fine"] as const).map((val) => (
                  <Chip
                    variant="choice"
                    key={val}
                    selected={draft.lifestyle?.smoking_drinking === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, smoking_drinking: val as SmokingDrinking } })
                    }
                  >
                    {val === "neither" ? "Neither" : val === "smoke_outside" ? "Smoke Outside" : val === "drink_occasionally" ? "Drink Occasionally" : "Both Fine"}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label-md text-ink-2 mb-2">Guests Policy</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Guests policy">
                {(["no_overnight_guests", "occasional_ok", "open_house"] as const).map((val) => (
                  <Chip
                    variant="choice"
                    key={val}
                    selected={draft.lifestyle?.guests_policy === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, guests_policy: val as GuestsPolicy } })
                    }
                  >
                    {val === "no_overnight_guests" ? "No Overnight" : val === "occasional_ok" ? "Occasional OK" : "Open House"}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {stepKey === "work_style" && (
        <>
          <h2 className="text-h2">Work Style</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-label-md text-ink-2 mb-2">Where do you work from?</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Work style">
                {(["wfh", "office", "hybrid"] as const).map((val) => (
                  <Chip
                    variant="choice"
                    key={val}
                    selected={draft.lifestyle?.work_style === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, work_style: val as WorkStyle } })
                    }
                  >
                    {val === "wfh" ? "Work from Home" : val === "office" ? "Office" : "Hybrid"}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {stepKey === "budget_timeline" && (
        <>
          <h2 className="text-h2">Budget & Timeline</h2>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Minimum budget"
                type="number"
                placeholder="Min budget"
                value={draft.budget_timeline?.budget_min ? String(draft.budget_timeline.budget_min) : ""}
                onChange={(e) =>
                  patchDraft({
                    budget_timeline: {
                      ...draft.budget_timeline,
                      budget_min: numberOrUndefined(e.target.value)
                    }
                  })
                }
              />
              <Input
                label="Maximum budget"
                type="number"
                placeholder="Max budget"
                value={draft.budget_timeline?.budget_max ? String(draft.budget_timeline.budget_max) : ""}
                onChange={(e) =>
                  patchDraft({
                    budget_timeline: {
                      ...draft.budget_timeline,
                      budget_max: numberOrUndefined(e.target.value)
                    }
                  })
                }
              />
            </div>
            <div>
              <p className="text-label-md text-ink-2 mb-2">Move-in Timeline</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Move-in timeline">
                {(["immediate", "this_month", "next_month", "flexible"] as const).map((val) => (
                  <Chip
                    variant="choice"
                    key={val}
                    selected={draft.budget_timeline?.move_in_timeline === val}
                    onClick={() =>
                      patchDraft({
                        budget_timeline: {
                          ...draft.budget_timeline,
                          move_in_timeline: val as MoveInTimeline
                        }
                      })
                    }
                  >
                    {val === "immediate" ? "Immediately" : val === "this_month" ? "This month" : val === "next_month" ? "Next month" : "Flexible"}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {stepKey === "preferences" && (
        <>
          <h2 className="text-h2">Your preferences</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-label-md text-ink-2 mb-2">Gender Preference</p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Gender preference">
                {(["male", "female", "any"] as const).map((val) => (
                  <Chip
                    variant="choice"
                    key={val}
                    selected={draft.preferences?.gender_preference === val}
                    onClick={() =>
                      patchDraft({
                        preferences: {
                          ...draft.preferences,
                          gender_preference: val as GenderPreference
                        }
                      })
                    }
                  >
                    {val === "any" ? "Any" : val === "male" ? "Male only" : "Female only"}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </>
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
