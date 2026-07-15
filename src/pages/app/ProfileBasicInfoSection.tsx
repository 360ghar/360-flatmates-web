import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { FLATMATE_MODE_OPTIONS } from "@/lib/data";
import { toSelectOptions, optionalNumberValue } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, SelectField } from "@/components/ui/Input";
import type { ProfileFormData } from "./ProfileEditPage";

const modeOptions = toSelectOptions(FLATMATE_MODE_OPTIONS);

interface ProfileBasicInfoSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
  bioValue: string;
}

export function ProfileBasicInfoSection({ register, errors, bioValue }: ProfileBasicInfoSectionProps) {
  return (
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
  );
}
