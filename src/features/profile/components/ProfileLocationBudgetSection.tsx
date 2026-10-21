import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { MOVE_IN_TIMELINE_OPTIONS } from "@/lib/data";
import { toSelectOptions, optionalNumberValue } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Input, SelectField } from "@/components/ui/Input";
import type { ProfileFormData } from "@/features/profile/lib/profile-form";

const timelineOptions = toSelectOptions(MOVE_IN_TIMELINE_OPTIONS);

interface ProfileLocationBudgetSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}

export function ProfileLocationBudgetSection({ register, errors }: ProfileLocationBudgetSectionProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3 text-ink">Location and budget</h2>
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
          label="Minimum budget"
          type="number"
          error={errors.budget_min?.message}
          placeholder="10000"
          {...register("budget_min", { setValueAs: optionalNumberValue })}
        />
        <Input
          label="Maximum budget"
          type="number"
          error={errors.budget_max?.message}
          placeholder="20000"
          {...register("budget_max", { setValueAs: optionalNumberValue })}
        />
      </div>
      <SelectField
        label="Move-in timeline"
        options={timelineOptions}
        placeholder="When do you want to move?"
        error={errors.move_in_timeline?.message}
        {...register("move_in_timeline")}
      />
    </Card>
  );
}
