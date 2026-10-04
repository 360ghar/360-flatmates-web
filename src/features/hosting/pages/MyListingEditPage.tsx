import { userMessage } from "@/lib/api/errors";
import { Page, PageHeader } from "@/components/ui/Layout";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMyProperty, useUpdateProperty } from "@/features/listings/hooks/useProperties";
import { useDirtyFormGuard } from "@/hooks/useDirtyFormGuard";
import { uiStore } from "@/lib/stores/ui-store";
import { listingSchema, type ListingFormData } from "@/features/hosting/lib/listing-form";
import { stripEmptyFields } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { InlineError } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListingPhotoManager } from "@/features/hosting/components/ListingPhotoManager";
import { ListingBasicInfoFields } from "@/features/hosting/components/ListingBasicInfoFields";
import { ListingLocationFields } from "@/features/hosting/components/ListingLocationFields";

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
      setup_cost: undefined,
      other_charges: undefined,
      other_charges_description: "",
      area_sqft: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      floor_number: undefined,
      total_floors: undefined,
      kitchen_type: undefined,
      ventilation_type: undefined,
      windows_count: undefined,
      ventilation_shafts: undefined,
      furnishing_level: undefined,
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
        setup_cost: property.setup_cost,
        other_charges: property.other_charges,
        other_charges_description: property.other_charges_description ?? "",
        area_sqft: property.area_sqft,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        floor_number: property.floor_number,
        total_floors: property.total_floors,
        kitchen_type: property.kitchen_type,
        ventilation_type: property.ventilation_type,
        windows_count: property.windows_count,
        ventilation_shafts: property.ventilation_shafts,
        furnishing_level: property.furnishing_level,
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
        navigate("/manage", { state: { skipDirtyGuard: true } });
      },
      onError: (err) => {
        setServerError(userMessage(err, "Failed to update listing"));
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
      <Page width="narrow">
        <Skeleton className="h-9 w-40" />
        <div className="rounded-hand bg-surface paper-grain p-5 shadow-sm">
          <Skeleton className="mb-4 h-5 w-20" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-cut-md" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-hand bg-surface paper-grain p-5 shadow-sm">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-12 w-full rounded-cut-md" />
            </div>
          ))}
        </div>
        <Skeleton className="h-[52px] w-full rounded-cut-md" />
        <Skeleton className="h-[52px] w-full rounded-cut-md" />
      </Page>
    );
  }

  const imageUrls = property?.image_urls ?? [];

  return (
    <Page width="narrow">
      <PageHeader title="Edit listing" />

      {error || !property ? (
        <InlineError
            title="Could not load listing"
            description="Please try again."
            onRetry={() => refetch()} />
      ) : (
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        {/* Server error */}
        {serverError && (
          <Card className="bg-error-soft p-4 text-body-md text-error" role="alert">
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
            Save changes
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
      <ConfirmModal
        open={blocker.state === "blocked"}
        title="Discard your listing changes?"
        description="You have edits that are not saved. If you leave now, you lose them."
        cancelLabel="Keep editing"
        confirmLabel="Discard changes"
        destructive
        onConfirm={() => blocker.proceed?.()}
        onClose={() => blocker.reset?.()}
      />
    </Page>
  );
}
