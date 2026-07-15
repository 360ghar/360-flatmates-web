import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMyProperty, useUpdateProperty } from "@/hooks/queries";
import { useDirtyFormGuard } from "@/hooks/useDirtyFormGuard";
import { uiStore } from "@/lib/stores/ui-store";
import {
  genderPreferenceSchema,
  listingSharingTypeSchema,
  societyTypeSchema,
} from "@/lib/schemas/enums";
import { stripEmptyFields } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListingPhotoManager } from "./ListingPhotoManager";
import { ListingBasicInfoFields } from "./ListingBasicInfoFields";
import { ListingLocationFields } from "./ListingLocationFields";

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
  video_tour_url: z.url().optional().or(z.literal("")),
  is_available: z.boolean().optional()
});

export type ListingFormData = z.infer<typeof listingSchema>;

/* ── Page component ──────────────────────────────────────── */

export function MyListingEditPage() {
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id);
  const navigate = useNavigate();

  const { data: property, isLoading, error, refetch } = useMyProperty(propertyId);
  const updateProperty = useUpdateProperty(propertyId);

  const [serverError, setServerError] = useState<string | null>(null);

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
        // Reset the form to the submitted values so isDirty clears (this also
        // stops the unsaved-changes guard from firing on the post-save nav).
        reset(data, { keepValues: true });
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

  /* Unsaved-changes guard: block in-app navigation while the form is dirty and
     not in the middle of saving; surface a confirmation modal. */
  const hasUnsavedChanges = isDirty && !updateProperty.isPending;
  const blocker = useDirtyFormGuard(
    hasUnsavedChanges,
    "You have unsaved listing edits. Leaving will discard them."
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-[8px]" />
          <Skeleton className="h-8 w-36" />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <Skeleton className="mb-4 h-5 w-20" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 w-full rounded-[8px]" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[52px] w-full rounded-[8px]" />
        <Skeleton className="h-[52px] w-full rounded-[8px]" />
      </div>
    );
  }

  const imageUrls = property?.image_urls ?? [];

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          onClick={() => blocker.confirmNavigation(() => navigate("/manage"))}
          aria-label="Back to listings"
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Edit Listing</h1>
      </div>

      {error || !property ? (
        <Card className="flex items-center justify-center p-8">
          <ErrorState
            title="Could not load listing"
            description="Please try again."
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {/* Server error */}
        {serverError && (
          <Card className="bg-error-soft text-error p-4 text-body-md">
            {serverError}
          </Card>
        )}

        {/* Photos */}
        <ListingPhotoManager propertyId={propertyId} imageUrls={imageUrls} />

        {/* Basic Info */}
        <ListingBasicInfoFields register={register} errors={errors} />

        {/* Location */}
        <ListingLocationFields register={register} errors={errors} />

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
            onClick={() => blocker.confirmNavigation(() => navigate("/manage"))}
          >
            Cancel
          </Button>
        </div>
      </form>
      )}

      {/* Unsaved-changes confirmation */}
      <Modal
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Discard unsaved listing changes?"
        description="You have edits that haven't been saved. Leaving now will discard them."
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
