import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { Camera, Crosshair, Loader2 } from "lucide-react";
import { useMyProfile, useCreateProfile, useUpdateProfile } from "@/hooks/queries";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useReverseGeocode } from "@/hooks/useReverseGeocode";
import { onboardingStore, ONBOARDING_STEPS, type OnboardingStepKey } from "@/lib/stores/onboarding-store";
import { searchStore } from "@/lib/stores/search-store";
import { uiStore } from "@/lib/stores/ui-store";
import { FLATMATE_MODE_OPTIONS, type FlatmatesMode } from "@/lib/data/domain";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Avatar } from "@/components/ui/Avatar";
import type { SleepSchedule, Cleanliness, FoodHabits, SmokingDrinking, GuestsPolicy, WorkStyle, MoveInTimeline, GenderPreference } from "@/lib/api/types";
import { humanizeSnakeCase } from "@/lib/utils";

interface OnboardingStepContentProps {
  stepKey: OnboardingStepKey;
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

  const { upload: uploadImage } = useImageUpload();
  const { geocode, geoLoading } = useReverseGeocode();

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
      if (!file) return;

      const dataUrl = await uploadImage(file);
      setPhotoPreview(dataUrl);
      patchDraft({ profile_image_url: dataUrl });
    },
    [uploadImage, patchDraft]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  function goNext() {
    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      const payload = {
        mode: draft.mode,
        full_name: draft.basic_info?.full_name,
        age: draft.basic_info?.age,
        profession: draft.basic_info?.profession,
        city: draft.location?.city,
        locality: draft.location?.locality,
        lat: draft.location?.lat,
        lng: draft.location?.lng,
        profile_image_url: draft.profile_image_url,
        ...draft.lifestyle,
        budget_min: draft.budget_timeline?.budget_min,
        budget_max: draft.budget_timeline?.budget_max,
        move_in_timeline: draft.budget_timeline?.move_in_timeline,
        gender_preference: draft.preferences?.gender_preference,
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
        navigate("/home");
      };

      if (profile) {
        updateProfile.mutate(payload, { onSuccess: onProfileSaved });
      } else {
        createProfile.mutate(payload, { onSuccess: onProfileSaved });
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

  const submitting = updateProfile.isPending || createProfile.isPending;
  const isLastStep = currentStep >= ONBOARDING_STEPS.length - 1;

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
              placeholder="Full name"
              value={draft.basic_info?.full_name ?? ""}
              onChange={(e) =>
                patchDraft({
                  basic_info: { ...draft.basic_info, full_name: e.target.value }
                })
              }
            />
            <Input
              type="number"
              placeholder="Age"
              value={draft.basic_info?.age ? String(draft.basic_info.age) : ""}
              onChange={(e) =>
                patchDraft({
                  basic_info: { ...draft.basic_info, age: Number(e.target.value) }
                })
              }
            />
            <Input
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
            <Button variant="secondary" onClick={openFilePicker}>
              <Camera aria-hidden="true" className="h-4 w-4" />
              {photoPreview || draft.profile_image_url ? "Change Photo" : "Choose Photo"}
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
              <div className="flex flex-wrap gap-2">
                {(["early_bird", "flexible", "night_owl"] as const).map((val) => (
                  <Chip
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
              <div className="flex flex-wrap gap-2">
                {(["minimal", "tidy", "spotless"] as const).map((val) => (
                  <Chip
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
              <div className="flex flex-wrap gap-2">
                {(["vegetarian", "non_vegetarian", "eggetarian", "no_preference"] as const).map((val) => (
                  <Chip
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
              <div className="flex flex-wrap gap-2">
                {(["neither", "smoke_outside", "no_preference"] as const).map((val) => (
                  <Chip
                    key={val}
                    selected={draft.lifestyle?.smoking_drinking === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, smoking_drinking: val as SmokingDrinking } })
                    }
                  >
                    {val === "neither" ? "Neither" : val === "smoke_outside" ? "Smoke Outside" : "No Preference"}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label-md text-ink-2 mb-2">Guests Policy</p>
              <div className="flex flex-wrap gap-2">
                {(["no_overnight", "occasional_ok", "open_house"] as const).map((val) => (
                  <Chip
                    key={val}
                    selected={draft.lifestyle?.guests_policy === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, guests_policy: val as GuestsPolicy } })
                    }
                  >
                    {val === "no_overnight" ? "No Overnight" : val === "occasional_ok" ? "Occasional OK" : "Open House"}
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
              <div className="flex flex-wrap gap-2">
                {(["wfh_mostly", "office_mostly", "mixed"] as const).map((val) => (
                  <Chip
                    key={val}
                    selected={draft.lifestyle?.work_style === val}
                    onClick={() =>
                      patchDraft({ lifestyle: { ...draft.lifestyle, work_style: val as WorkStyle } })
                    }
                  >
                    {val === "wfh_mostly" ? "WFH Mostly" : val === "office_mostly" ? "Office Mostly" : "Mixed / Hybrid"}
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
                type="number"
                placeholder="Min budget"
                value={draft.budget_timeline?.budget_min ? String(draft.budget_timeline.budget_min) : ""}
                onChange={(e) =>
                  patchDraft({
                    budget_timeline: {
                      ...draft.budget_timeline,
                      budget_min: Number(e.target.value)
                    }
                  })
                }
              />
              <Input
                type="number"
                placeholder="Max budget"
                value={draft.budget_timeline?.budget_max ? String(draft.budget_timeline.budget_max) : ""}
                onChange={(e) =>
                  patchDraft({
                    budget_timeline: {
                      ...draft.budget_timeline,
                      budget_max: Number(e.target.value)
                    }
                  })
                }
              />
            </div>
            <div>
              <p className="text-label-md text-ink-2 mb-2">Move-in Timeline</p>
              <div className="flex flex-wrap gap-2">
                {(["immediate", "this_month", "next_month", "flexible"] as const).map((val) => (
                  <Chip
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
              <div className="flex flex-wrap gap-2">
                {(["male", "female", "any"] as const).map((val) => (
                  <Chip
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
        <Button fullWidth loading={submitting} onClick={goNext}>
          {isLastStep ? "Complete Setup" : "Next"}
        </Button>
      </div>
    </div>
  );
}
