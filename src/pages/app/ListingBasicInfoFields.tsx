import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, SelectField } from "@/components/ui/Input";
import { GENDER_PREFERENCE_VALUES, LISTING_SHARING_TYPE_OPTIONS } from "@/lib/data";
import { toSelectOptions } from "@/lib/utils";
import type { ListingFormData } from "./MyListingEditPage";

const genderPrefOptions = toSelectOptions(GENDER_PREFERENCE_VALUES);
const sharingTypeOptions = toSelectOptions(LISTING_SHARING_TYPE_OPTIONS);

export function ListingBasicInfoFields({
  register,
  errors
}: {
  register: UseFormRegister<ListingFormData>;
  errors: FieldErrors<ListingFormData>;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Basic Information</h2>
      <Input
        label="Title"
        error={errors.title?.message}
        {...register("title")}
      />
      <TextArea
        label="Description"
        error={errors.description?.message}
        placeholder="Describe your listing..."
        {...register("description")}
      />
      <Input
        label="Monthly Rent"
        type="number"
        error={errors.monthly_rent?.message}
        placeholder="15000"
        {...register("monthly_rent", { valueAsNumber: true })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Security Deposit"
          type="number"
          error={errors.security_deposit?.message}
          placeholder="30000"
          {...register("security_deposit", { valueAsNumber: true })}
        />
        <Input
          label="Maintenance"
          type="number"
          error={errors.maintenance_charges?.message}
          placeholder="2000"
          {...register("maintenance_charges", { valueAsNumber: true })}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Bedrooms"
          type="number"
          error={errors.bedrooms?.message}
          placeholder="1"
          {...register("bedrooms", { valueAsNumber: true })}
        />
        <Input
          label="Bathrooms"
          type="number"
          error={errors.bathrooms?.message}
          placeholder="1"
          {...register("bathrooms", { valueAsNumber: true })}
        />
        <Input
          label="Area (sqft)"
          type="number"
          error={errors.area_sqft?.message}
          placeholder="800"
          {...register("area_sqft", { valueAsNumber: true })}
        />
      </div>
      <SelectField
        label="Sharing Type"
        options={sharingTypeOptions}
        placeholder="Select sharing type"
        error={errors.sharing_type?.message}
        {...register("sharing_type")}
      />
      <SelectField
        label="Gender Preference"
        options={genderPrefOptions}
        placeholder="Any preference?"
        error={errors.gender_preference?.message}
        {...register("gender_preference")}
      />
      <Input
        label="Available From"
        type="date"
        error={errors.available_from?.message}
        {...register("available_from")}
      />
    </Card>
  );
}
