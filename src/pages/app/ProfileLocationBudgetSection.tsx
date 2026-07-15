import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { MOVE_IN_TIMELINE_OPTIONS } from "@/lib/data";
import { toSelectOptions, optionalNumberValue } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Input, SelectField } from "@/components/ui/Input";
import type { ProfileFormData } from "./ProfileEditPage";

const timelineOptions = toSelectOptions(MOVE_IN_TIMELINE_OPTIONS);

interface ProfileLocationBudgetSectionProps {
  register: UseFormRegister<ProfileFormData>;
  errors: FieldErrors<ProfileFormData>;
}

export function ProfileLocationBudgetSection({ register, errors }: ProfileLocationBudgetSectionProps) {
  return (
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
  );
}
