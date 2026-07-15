import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Input, SelectField } from "@/components/ui/Input";
import { SOCIETY_TYPE_VALUES } from "@/lib/data";
import { toSelectOptions } from "@/lib/utils";
import type { ListingFormData } from "./MyListingEditPage";

const societyTypeOptions = toSelectOptions(SOCIETY_TYPE_VALUES);

export function ListingLocationFields({
  register,
  errors
}: {
  register: UseFormRegister<ListingFormData>;
  errors: FieldErrors<ListingFormData>;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Location</h2>
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
      <Input
        label="Sub Locality"
        error={errors.sub_locality?.message}
        placeholder="5th Block"
        {...register("sub_locality")}
      />
      <SelectField
        label="Society Type"
        options={societyTypeOptions}
        placeholder="Select society type"
        error={errors.society_type?.message}
        {...register("society_type")}
      />
    </Card>
  );
}
