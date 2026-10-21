import type { UseFormRegister, FieldErrors } from "react-hook-form";
import {
  FLATMATE_MODE_OPTIONS,
  NATIVE_PLACE_MAX_LENGTH,
  LINKEDIN_URL_MAX_LENGTH
} from "@/lib/data";
import { toSelectOptions, optionalNumberValue } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, SelectField } from "@/components/ui/Input";
import type { ProfileFormData } from "@/features/profile/lib/profile-form";

const modeOptions = toSelectOptions(FLATMATE_MODE_OPTIONS);

interface ProfileBasicInfoSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  bioValue: string;
}

export function ProfileBasicInfoSection({ register, errors, bioValue }: ProfileBasicInfoSectionProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3 text-ink">Basic information</h2>
      <Input
        label="Full name"
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
      <Input
        label="Native place"
        error={errors.native_place?.message}
        helperText={`${NATIVE_PLACE_MAX_LENGTH} characters max`}
        maxLength={NATIVE_PLACE_MAX_LENGTH}
        placeholder="e.g. Jaipur, Rajasthan"
        {...register("native_place")}
      />
      <Input
        label="LinkedIn URL"
        type="url"
        error={errors.linkedin_url?.message}
        helperText={`${LINKEDIN_URL_MAX_LENGTH} characters max`}
        maxLength={LINKEDIN_URL_MAX_LENGTH}
        placeholder="https://www.linkedin.com/in/your-profile"
        {...register("linkedin_url")}
      />
    </Card>
  );
}
