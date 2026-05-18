import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProperty, useUpdateProperty, useUploadPropertyImage } from "@/hooks/queries";
import { useImageUpload } from "@/hooks/useImageUpload";
import { uiStore } from "@/lib/stores/ui-store";
import {
  GENDER_PREFERENCE_VALUES,
  LISTING_SHARING_TYPE_OPTIONS,
  SOCIETY_TYPE_VALUES,
} from "@/lib/data";
import {
  genderPreferenceSchema,
  listingSharingTypeSchema,
  societyTypeSchema,
} from "@/lib/schemas/enums";
import { toSelectOptions, stripEmptyFields } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, TextArea, SelectField } from "@/components/ui/Input";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";

/* ── Zod schema ──────────────────────────────────────────── */

const listingSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional(),
  city: z.string().min(1, "City is required").max(60),
  locality: z.string().min(1, "Locality is required").max(80),
  sub_locality: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  monthly_rent: z.number().min(1, "Rent is required"),
  security_deposit: z.number().min(0).optional(),
  maintenance_charges: z.number().min(0).optional(),
  area_sqft: z.number().min(0).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  available_from: z.string().optional(),
  gender_preference: genderPreferenceSchema.optional(),
  sharing_type: listingSharingTypeSchema.optional(),
  society_type: societyTypeSchema.optional(),
  video_tour_url: z.string().url().optional().or(z.literal("")),
  is_available: z.boolean().optional()
});

type ListingFormData = z.infer<typeof listingSchema>;

/* ── Select option helpers ───────────────────────────────── */

const genderPrefOptions = toSelectOptions(GENDER_PREFERENCE_VALUES);

const sharingTypeOptions = toSelectOptions(LISTING_SHARING_TYPE_OPTIONS);

const societyTypeOptions = toSelectOptions(SOCIETY_TYPE_VALUES);

/* ── Page component ──────────────────────────────────────── */

export function MyListingEditPage() {
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);
  const navigate = useNavigate();

  const { data: property, isLoading, error, refetch } = useProperty(propertyId);
  const updateProperty = useUpdateProperty(propertyId);
  const uploadImage = useUploadPropertyImage();
  const { upload: uploadImageFile } = useImageUpload();

  const [serverError, setServerError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      city: "",
      locality: "",
      sub_locality: "",
      address: "",
      monthly_rent: undefined,
      security_deposit: undefined,
      maintenance_charges: undefined,
      area_sqft: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      available_from: "",
      gender_preference: undefined,
      sharing_type: undefined,
      society_type: undefined,
      video_tour_url: "",
      is_available: true
    }
  });

  /* Populate form when property data arrives */
  useEffect(() => {
    if (property && !isDirty) {
      const defaults: ListingFormData = {
        title: property.title ?? "",
        description: property.description ?? "",
        city: property.city ?? "",
        locality: property.locality ?? "",
        sub_locality: property.sub_locality ?? "",
        address: "",
        monthly_rent: property.monthly_rent,
        security_deposit: property.security_deposit,
        maintenance_charges: property.maintenance_charges,
        area_sqft: property.area_sqft,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        available_from: property.available_from ?? "",
        gender_preference: property.gender_preference,
        sharing_type: property.sharing_type,
        society_type: property.society_type,
        video_tour_url: property.video_tour_url ?? "",
        is_available: property.is_available ?? true
      };
      reset(defaults);
    }
  }, [property, isDirty, reset]);

  function onSubmit(data: ListingFormData) {
    setServerError(null);

    const payload = stripEmptyFields(data as Record<string, unknown>);

    updateProperty.mutate(payload, {
      onSuccess: () => {
        uiStore.getState().pushToast({
          type: "success",
          title: "Listing updated",
          description: "Your changes have been saved."
        });
        navigate("/manage");
      },
      onError: (err) => {
        setServerError(err instanceof Error ? err.message : "Failed to update listing");
      }
    });
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUploading(true);

    try {
      const dataUrl = await uploadImageFile(file);

      uploadImage.mutate(
        {
          propertyId,
          payload: { image_url: dataUrl, is_main: !(property?.image_urls?.length) }
        },
        {
          onSuccess: () => {
            uiStore.getState().pushToast({
              type: "success",
              title: "Photo added",
              description: "Your photo has been uploaded."
            });
          },
          onError: (err) => {
            uiStore.getState().pushToast({
              type: "error",
              title: "Upload failed",
              description: err instanceof Error ? err.message : "Could not upload photo."
            });
          },
          onSettled: () => {
            setImageUploading(false);
          }
        }
      );
    } catch {
      setImageUploading(false);
      uiStore.getState().pushToast({
        type: "error",
        title: "Upload failed",
        description: "Could not read the selected file."
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6 max-w-lg mx-auto">
        <Skeleton variant="listItem" />
        <Skeleton variant="block" count={5} className="h-12" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState
          title="Could not load listing"
          description="Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const imageUrls = property.image_urls ?? [];

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          onClick={() => navigate("/manage")}
          aria-label="Back to listings"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Edit Listing</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {/* Server error */}
        {serverError && (
          <Card className="bg-error-soft text-error p-4 text-body-md">
            {serverError}
          </Card>
        )}

        {/* Photos */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Photos</h2>
          {imageUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                  <NetworkImage alt={`Photo ${index + 1}`} src={url} wrapperClassName="h-full w-full" />
                </div>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[9px] border-2 border-dashed border-line bg-paper-2 px-4 py-3 text-body-md text-ink-2 transition-colors hover:border-accent/40 hover:bg-accent-soft">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageUpload}
              disabled={imageUploading}
            />
            {imageUploading ? "Uploading..." : "Add Photo"}
          </label>
        </Card>

        {/* Basic Info */}
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

        {/* Location */}
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

        {/* Availability */}
        <Card className="flex flex-col gap-4 p-5">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5 rounded accent-accent"
              {...register("is_available")}
            />
            <span className="text-body-md text-ink">Listing is available</span>
          </label>
        </Card>

        {/* Submit */}
        <div className="flex flex-col gap-2 pb-6">
          <Button
            type="submit"
            fullWidth
            loading={updateProperty.isPending}
            disabled={!isDirty}
          >
            Save Changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => navigate("/manage")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
