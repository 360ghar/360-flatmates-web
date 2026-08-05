import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, SelectField } from "@/components/ui/Input";
import {
  FURNISHING_LEVEL_OPTIONS,
  GENDER_PREFERENCE_VALUES,
  KITCHEN_TYPE_OPTIONS,
  LISTING_SHARING_TYPE_OPTIONS,
  VENTILATION_TYPE_OPTIONS
} from "@/lib/data";
import { toSelectOptions } from "@/lib/utils";
import type { ListingFormData } from "./MyListingEditPage";

const genderPrefOptions = toSelectOptions(GENDER_PREFERENCE_VALUES);
const sharingTypeOptions = toSelectOptions(LISTING_SHARING_TYPE_OPTIONS);
const kitchenTypeOptions = toSelectOptions(KITCHEN_TYPE_OPTIONS);
const ventilationTypeOptions = toSelectOptions(VENTILATION_TYPE_OPTIONS);
const furnishingOptions = toSelectOptions(FURNISHING_LEVEL_OPTIONS);

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
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Setup Cost"
          type="number"
          error={errors.setup_cost?.message}
          placeholder="5000"
          {...register("setup_cost", { valueAsNumber: true })}
        />
        <Input
          label="Other Charges"
          type="number"
          error={errors.other_charges?.message}
          placeholder="0"
          {...register("other_charges", { valueAsNumber: true })}
        />
      </div>
      <Input
        label="Other Charges Description"
        error={errors.other_charges_description?.message}
        placeholder="e.g. maintenance collected separately"
        maxLength={300}
        {...register("other_charges_description")}
      />
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
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Floor Number"
          type="number"
          min={0}
          error={errors.floor_number?.message}
          placeholder="3"
          {...register("floor_number", { valueAsNumber: true })}
        />
        <Input
          label="Total Floors"
          type="number"
          min={1}
          error={errors.total_floors?.message}
          placeholder="12"
          {...register("total_floors", { valueAsNumber: true })}
        />
      </div>
      <SelectField
        label="Sharing Type"
        options={sharingTypeOptions}
        placeholder="Select sharing type"
        error={errors.sharing_type?.message}
        {...register("sharing_type")}
      />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Kitchen Type"
          options={kitchenTypeOptions}
          placeholder="Select kitchen type"
          error={errors.kitchen_type?.message}
          {...register("kitchen_type")}
        />
        <SelectField
          label="Ventilation"
          options={ventilationTypeOptions}
          placeholder="Select ventilation"
          error={errors.ventilation_type?.message}
          {...register("ventilation_type")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Windows"
          type="number"
          min={0}
          max={100}
          error={errors.windows_count?.message}
          placeholder="4"
          {...register("windows_count", { valueAsNumber: true })}
        />
        <Input
          label="Ventilation Shafts"
          type="number"
          min={0}
          max={50}
          error={errors.ventilation_shafts?.message}
          placeholder="2"
          {...register("ventilation_shafts", { valueAsNumber: true })}
        />
      </div>
      <SelectField
        label="Furnishing"
        options={furnishingOptions}
        placeholder="Select furnishing"
        error={errors.furnishing_level?.message}
        {...register("furnishing_level")}
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
