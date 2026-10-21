import { userMessage } from "@/lib/api/errors";
import { applyFieldErrors } from "@/lib/api/form-errors";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMyProfile, useUpdateProfile } from "@/hooks/queries/useProfiles";
import { uiStore } from "@/lib/stores/ui-store";
import { profileSchema, toProfileUpdate, type ProfileFormData } from "@/features/profile/lib/profile-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InlineError } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useDirtyFormGuard } from "@/hooks/useDirtyFormGuard";
import { ProfileContactInfoSection } from "@/features/profile/components/ProfileContactInfoSection";
import { ProfileBasicInfoSection } from "@/features/profile/components/ProfileBasicInfoSection";
import { ProfileLocationBudgetSection } from "@/features/profile/components/ProfileLocationBudgetSection";
import { ProfileLifestylePreferencesSection } from "@/features/profile/components/ProfileLifestylePreferencesSection";

/* ── Page component ──────────────────────────────────────── */

export function ProfileEditPage() {
  const navigate = useNavigate();
  const { data: profile, isLoading, error, refetch } = useMyProfile();
  const updateProfile = useUpdateProfile();

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setError,
    formState: { errors, isDirty, dirtyFields }
  } = useForm<ProfileFormData>({
    // moveInTimelineSchema preprocesses legacy values, so its inferred input
    // type is wider than the form's output type; the resolver is safe because
    // the preprocessor normalizes any legacy value to a valid enum member.
    resolver: zodResolver(profileSchema) as Resolver<ProfileFormData>,
    defaultValues: {
      full_name: "",
      bio: "",
      profession: "",
      age: undefined,
      city: "",
      locality: "",
      budget_min: undefined,
      budget_max: undefined,
      move_in_timeline: undefined,
      sleep_schedule: undefined,
      cleanliness: undefined,
      food_habits: undefined,
      smoking: undefined,
      drinking: undefined,
      native_place: "",
      linkedin_url: "",
      guests_policy: undefined,
      work_style: undefined,
      gender: "",
      gender_preference: undefined,
      mode: undefined
    }
  });

  const bioValue = useWatch({ control, name: "bio" }) ?? "";

  /* Populate form when profile data arrives */
  useEffect(() => {
    if (profile && !isDirty) {
      const defaults: ProfileFormData = {
        full_name: profile.full_name ?? "",
        bio: profile.bio ?? "",
        profession: profile.profession ?? "",
        age: profile.age,
        native_place: profile.native_place ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        city: profile.city ?? "",
        locality: profile.locality ?? "",
        budget_min: profile.budget_min,
        budget_max: profile.budget_max,
        move_in_timeline: profile.move_in_timeline,
        sleep_schedule: profile.sleep_schedule,
        cleanliness: profile.cleanliness,
        food_habits: profile.food_habits,
        smoking: profile.smoking,
        drinking: profile.drinking,
        guests_policy: profile.guests_policy,
        work_style: profile.work_style,
        gender: profile.gender ?? "",
        gender_preference: profile.gender_preference,
        mode: profile.mode ?? undefined
      };
      reset(defaults);
    }
  }, [profile, isDirty, reset]);

  function onSubmit(data: ProfileFormData) {
    setServerError(null);

    // Only the changed fields go out. Email and phone are not profile fields.
    const payload = toProfileUpdate(data, dirtyFields);

    updateProfile.mutate(payload, {
      onSuccess: () => {
        // Reset the form to the submitted values so isDirty clears (this also
        // stops the unsaved-changes guard from firing on the post-save nav).
        reset(data, { keepValues: true });
        uiStore.getState().pushToast({
          type: "success",
          title: "Profile updated",
          description: "Your changes have been saved."
        });
        navigate("/profile", { state: { skipDirtyGuard: true } });
      },
      onError: (err) => {
        const fieldLine = applyFieldErrors(err, setError, Object.keys(getValues()));
        setServerError(fieldLine ?? userMessage(err, "Failed to update profile"));
      }
    });
  }

  /* Unsaved-changes guard: block in-app navigation while the form is dirty and
     not in the middle of saving; surface a confirmation modal. */
  const hasUnsavedChanges = isDirty && !updateProfile.isPending;
  const blocker = useDirtyFormGuard(
    hasUnsavedChanges,
    "You have edits that haven't been saved. Leaving now will discard them."
  );

  if (isLoading) {
    return (
      <Page width="narrow">
        <Skeleton variant="form" fields={6} />
      </Page>
    );
  }

  return (
    <Page width="narrow">
      <PageHeader title="Edit profile" />

      {error || !profile ? (
        <InlineError
            title="Could not load profile"
            description="Please try again."
            onRetry={() => refetch()} />
      ) : (

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {/* Server error */}
        {serverError && (
          <Card className="bg-error-soft p-4 text-body-md text-error" role="alert">
            {serverError}
          </Card>
        )}

        <ProfileContactInfoSection email={profile.email} phone={profile.phone} />

        <ProfileBasicInfoSection register={register} errors={errors} bioValue={bioValue} />

        <ProfileLocationBudgetSection register={register} errors={errors} />

        <ProfileLifestylePreferencesSection register={register} errors={errors} />

        {/* TODO(privacy): per-field privacy toggles (e.g. hide phone from
            non-matches, hide budget from public profiles) belong here, but
            the API does not yet support field-level visibility (A-8). Add
            the controls once the backend defines a privacy-settings wire. */}

        {/* Submit */}
        <div className="flex flex-col gap-2 pb-6">
          <Button
            type="submit"
            fullWidth
            loading={updateProfile.isPending}
            disabled={!isDirty}
          >
            Save changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => blocker.confirmNavigation(() => navigate("/profile"))}
          >
            Cancel
          </Button>
        </div>
      </form>
      )}

      {/* Unsaved-changes confirmation */}
      <ConfirmModal
        open={blocker.state === "blocked"}
        title="Discard your changes?"
        description="You have edits that are not saved. If you leave now, you lose them."
        cancelLabel="Keep editing"
        confirmLabel="Discard changes"
        destructive
        onConfirm={() => blocker.proceed?.()}
        onClose={() => blocker.reset?.()}
      />
    </Page>
  );
}
