import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyProfile, useUpdateProfile } from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import {
  MOVE_IN_TIMELINE_OPTIONS,
  SLEEP_SCHEDULE_VALUES,
  CLEANLINESS_VALUES,
  FOOD_HABITS_VALUES,
  SMOKING_DRINKING_VALUES,
  GUESTS_POLICY_VALUES,
  WORK_STYLE_VALUES,
  GENDER_PREFERENCE_VALUES,
  FLATMATE_MODE_OPTIONS,
} from "@/lib/data";
import {
  flatmatesModeSchema,
  genderPreferenceSchema,
  moveInTimelineSchema,
  sleepScheduleSchema,
  cleanlinessSchema,
  foodHabitsSchema,
  smokingDrinkingSchema,
  guestsPolicySchema,
  workStyleSchema,
} from "@/lib/schemas/enums";
import { toSelectOptions, stripEmptyFields } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, SelectField } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useDirtyFormGuard } from "@/hooks/useDirtyFormGuard";

/* ── Zod schema ──────────────────────────────────────────── */

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(500, "Bio must be 500 characters or fewer").optional(),
  profession: z.string().max(80).optional(),
  age: z.number().min(18, "Must be at least 18").max(120).optional(),
  city: z.string().max(60).optional(),
  locality: z.string().max(80).optional(),
  budget_min: z.number().min(0, "Cannot be negative").optional(),
  budget_max: z.number().min(0, "Cannot be negative").optional(),
  move_in_timeline: moveInTimelineSchema.optional(),
  sleep_schedule: sleepScheduleSchema.optional(),
  cleanliness: cleanlinessSchema.optional(),
  food_habits: foodHabitsSchema.optional(),
  smoking_drinking: smokingDrinkingSchema.optional(),
  guests_policy: guestsPolicySchema.optional(),
  work_style: workStyleSchema.optional(),
  gender: z.string().optional(),
  gender_preference: genderPreferenceSchema.optional(),
  mode: flatmatesModeSchema.optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal(""))
}).refine(
  (data) =>
    data.budget_min === undefined ||
    data.budget_max === undefined ||
    Number.isNaN(data.budget_min) ||
    Number.isNaN(data.budget_max) ||
    data.budget_max >= data.budget_min,
  {
    message: "Maximum budget must be greater than or equal to minimum",
    path: ["budget_max"]
  }
);

type ProfileFormData = z.infer<typeof profileSchema>;

/** Coerce a numeric input to a number, mapping empty/NaN to undefined so a
 *  cleared field neither trips min/max validation nor gets sent to the API. */
function optionalNumberValue(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/* ── Select option helpers ───────────────────────────────── */

const timelineOptions = toSelectOptions(MOVE_IN_TIMELINE_OPTIONS);

const sleepOptions = toSelectOptions(SLEEP_SCHEDULE_VALUES);

const cleanlinessOptions = toSelectOptions(CLEANLINESS_VALUES);

const foodOptions = toSelectOptions(FOOD_HABITS_VALUES);

const smokingOptions = toSelectOptions(SMOKING_DRINKING_VALUES);

const guestsOptions = toSelectOptions(GUESTS_POLICY_VALUES);

const workStyleOptions = toSelectOptions(WORK_STYLE_VALUES);

const genderPrefOptions = toSelectOptions(GENDER_PREFERENCE_VALUES);

const modeOptions = toSelectOptions(FLATMATE_MODE_OPTIONS);

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
    formState: { errors, isDirty }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
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
      smoking_drinking: undefined,
      guests_policy: undefined,
      work_style: undefined,
      gender: "",
      gender_preference: undefined,
      mode: undefined,
      email: "",
      phone: ""
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
        city: profile.city ?? "",
        locality: profile.locality ?? "",
        budget_min: profile.budget_min,
        budget_max: profile.budget_max,
        move_in_timeline: profile.move_in_timeline,
        sleep_schedule: profile.sleep_schedule,
        cleanliness: profile.cleanliness,
        food_habits: profile.food_habits,
        smoking_drinking: profile.smoking_drinking,
        guests_policy: profile.guests_policy,
        work_style: profile.work_style,
        gender: profile.gender ?? "",
        gender_preference: profile.gender_preference,
        mode: profile.mode,
        email: profile.email ?? "",
        phone: profile.phone ?? ""
      };
      reset(defaults);
    }
  }, [profile, isDirty, reset]);

  const hasEmail = typeof profile?.email === "string" && profile.email.trim().length > 0;
  const hasPhone = typeof profile?.phone === "string" && profile.phone.trim().length > 0;

  function onSubmit(data: ProfileFormData) {
    setServerError(null);

    const payload = stripEmptyFields(data as Record<string, unknown>);

    if (hasEmail) {
      delete payload.email;
    }
    if (hasPhone) {
      delete payload.phone;
    } else if (payload.phone) {
      // Accept any 10-digit Indian mobile number. Strip spaces, dashes, the
      // country code prefix (91), and any other non-digits; require exactly
      // 10 surviving digits (A-15). Anything else surfaces an inline error.
      const digits = (payload.phone as string)
        .replace(/\D/g, "")
        .replace(/^91/, "")
        .slice(-10);
      if (digits.length !== 10) {
        setServerError("Please enter a valid 10-digit phone number.");
        return;
      }
      payload.phone = `+91${digits}`;
    }

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
        navigate("/profile");
      },
      onError: (err) => {
        setServerError(err instanceof Error ? err.message : "Failed to update profile");
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
      <div className="page-fade max-w-lg mx-auto">
        <Skeleton variant="form" fields={6} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 page-fade max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          onClick={() => blocker.confirmNavigation(() => navigate("/profile"))}
          aria-label="Back to profile"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Edit Profile</h1>
      </div>

      {error || !profile ? (
        <Card className="flex items-center justify-center p-8">
          <ErrorState
            title="Could not load profile"
            description="Please try again."
            onRetry={() => refetch()}
          />
        </Card>
      ) : (

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {/* Server error */}
        {serverError && (
          <Card className="bg-error-soft text-error p-4 text-body-md" role="alert">
            {serverError}
          </Card>
        )}

        {/* Contact Information */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Contact Information</h2>
          <Input
            label="Email"
            type="email"
            readOnly={hasEmail}
            disabled={hasEmail}
            error={errors.email?.message}
            helperText={hasEmail ? "Email is verified and cannot be changed here." : undefined}
            placeholder={hasEmail ? undefined : "you@example.com"}
            {...register("email")}
          />
          <Input
            label="Phone Number"
            type="tel"
            readOnly={hasPhone}
            disabled={hasPhone}
            error={errors.phone?.message}
            helperText={hasPhone ? "Phone is verified and cannot be changed here." : "Enter a 10-digit mobile number."}
            placeholder={hasPhone ? undefined : "9876543210"}
            {...register("phone")}
          />
        </Card>

        {/* Basic Info */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Basic Information</h2>
          <Input
            label="Full Name"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
          <TextArea
            label="Bio"
            error={errors.bio?.message}
            helperText={`${bioValue.length}/500`}
            maxLength={500}
            placeholder="Tell flatmates about yourself..."
            {...register("bio")}
          />
          <Input
            label="Profession"
            error={errors.profession?.message}
            placeholder="Software Engineer"
            {...register("profession")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Age"
              type="number"
              error={errors.age?.message}
              placeholder="25"
              {...register("age", { setValueAs: optionalNumberValue })}
            />
            <SelectField
              label="Mode"
              options={modeOptions}
              placeholder="Select mode"
              error={errors.mode?.message}
              {...register("mode")}
            />
          </div>
        </Card>

        {/* Location & Budget */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Location & Budget</h2>
          <Input
            label="City"
            error={errors.city?.message}
            placeholder="Gurugram"
            {...register("city")}
          />
          <Input
            label="Locality"
            error={errors.locality?.message}
            placeholder="DLF Phase 1"
            {...register("locality")}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Budget Min"
              type="number"
              error={errors.budget_min?.message}
              placeholder="10000"
              {...register("budget_min", { setValueAs: optionalNumberValue })}
            />
            <Input
              label="Budget Max"
              type="number"
              error={errors.budget_max?.message}
              placeholder="20000"
              {...register("budget_max", { setValueAs: optionalNumberValue })}
            />
          </div>
          <SelectField
            label="Move-in Timeline"
            options={timelineOptions}
            placeholder="When do you want to move?"
            error={errors.move_in_timeline?.message}
            {...register("move_in_timeline")}
          />
        </Card>

        {/* Lifestyle Preferences */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Lifestyle Preferences</h2>
          <SelectField
            label="Sleep Schedule"
            options={sleepOptions}
            placeholder="Select schedule"
            error={errors.sleep_schedule?.message}
            {...register("sleep_schedule")}
          />
          <SelectField
            label="Cleanliness"
            options={cleanlinessOptions}
            placeholder="Select cleanliness level"
            error={errors.cleanliness?.message}
            {...register("cleanliness")}
          />
          <SelectField
            label="Food Habits"
            options={foodOptions}
            placeholder="Select food habits"
            error={errors.food_habits?.message}
            {...register("food_habits")}
          />
          <SelectField
            label="Smoking / Drinking"
            options={smokingOptions}
            placeholder="Select preference"
            error={errors.smoking_drinking?.message}
            {...register("smoking_drinking")}
          />
          <SelectField
            label="Guests Policy"
            options={guestsOptions}
            placeholder="Select guests policy"
            error={errors.guests_policy?.message}
            {...register("guests_policy")}
          />
          <SelectField
            label="Work Style"
            options={workStyleOptions}
            placeholder="Select work style"
            error={errors.work_style?.message}
            {...register("work_style")}
          />
          <SelectField
            label="Gender Preference"
            options={genderPrefOptions}
            placeholder="Any preference?"
            error={errors.gender_preference?.message}
            {...register("gender_preference")}
          />
        </Card>

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
            Save Changes
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
      <Modal
        open={blocker.state === "blocked"}
        title="Discard unsaved changes?"
        description="You have edits that haven't been saved. Leaving now will discard them."
        onClose={() => blocker.reset?.()}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => blocker.reset?.()}
              className="w-full md:w-auto"
            >
              Keep editing
            </Button>
            <Button
              variant="primary"
              onClick={() => blocker.proceed?.()}
              className="w-full bg-error text-white hover:bg-error/95 md:w-auto"
            >
              Discard changes
            </Button>
          </>
        }
      />
    </div>
  );
}
