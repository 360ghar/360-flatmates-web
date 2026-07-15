import type { UseFormRegister, FieldErrors } from "react-hook-form";
import {
  SLEEP_SCHEDULE_VALUES,
  CLEANLINESS_VALUES,
  FOOD_HABITS_VALUES,
  SMOKING_DRINKING_VALUES,
  GUESTS_POLICY_VALUES,
  WORK_STYLE_VALUES,
  GENDER_PREFERENCE_VALUES
} from "@/lib/data";
import { toSelectOptions } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/Input";
import type { ProfileFormData } from "./ProfileEditPage";

const sleepOptions = toSelectOptions(SLEEP_SCHEDULE_VALUES);

const cleanlinessOptions = toSelectOptions(CLEANLINESS_VALUES);

const foodOptions = toSelectOptions(FOOD_HABITS_VALUES);

const smokingOptions = toSelectOptions(SMOKING_DRINKING_VALUES);

const guestsOptions = toSelectOptions(GUESTS_POLICY_VALUES);

const workStyleOptions = toSelectOptions(WORK_STYLE_VALUES);

const genderPrefOptions = toSelectOptions(GENDER_PREFERENCE_VALUES);

interface ProfileLifestylePreferencesSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}

export function ProfileLifestylePreferencesSection({
  register,
  errors
}: ProfileLifestylePreferencesSectionProps) {
  return (
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
  );
}
