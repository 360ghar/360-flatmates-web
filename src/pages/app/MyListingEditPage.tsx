import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useBatchDeleteMedia,
  useProperty,
  useUpdateProperty,
  useUploadPropertyImage
} from "@/hooks/queries";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useDirtyFormGuard } from "@/hooks/useDirtyFormGuard";
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
import { Modal } from "@/components/ui/Modal";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { ErrorState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";

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

  /* ----- Multi-select photo deletion ----- */
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedPhotoIndexes, setSelectedPhotoIndexes] = useState<number[]>([]);
  const batchDeleteMedia = useBatchDeleteMedia();

  const handleTogglePhoto = (index: number) => {
    setSelectedPhotoIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDeleteSelectedPhotos = () => {
    const selected = (imageUrls ?? []).filter((_, i) =>
      selectedPhotoIndexes.includes(i)
    );
    if (selected.length === 0) return;
    batchDeleteMedia.mutate(
      { media_ids: selected },
      {
        onSuccess: (result) => {
          const remaining = (imageUrls ?? []).filter(
            (_, i) => !selectedPhotoIndexes.includes(i)
          );
          updateProperty.mutate({ image_urls: remaining });
          uiStore.getState().pushToast({
            type: result.failed.length === 0 ? "success" : "warning",
            title: `Deleted ${result.deleted.length} photo${result.deleted.length === 1 ? "" : "s"}`,
            description:
              result.failed.length > 0
                ? `${result.failed.length} could not be removed`
                : undefined
          });
          setSelectedPhotoIndexes([]);
          setMultiSelect(false);
        },
        onError: () =>
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not delete photos"
          })
      }
    );
  };

  /* Unsaved-changes guard: block in-app navigation while the form is dirty and
     not in the middle of saving; surface a confirmation modal. */
  const hasUnsavedChanges = isDirty && !updateProperty.isPending;
  const blocker = useDirtyFormGuard(
    hasUnsavedChanges,
    "You have unsaved listing edits. Leaving will discard them."
  );

  /* ── Photo grid controls ─────────────────────────────────
   * The PostPage wizard shows a "Main" badge and per-photo remove / set-as-main
   * controls. We mirror those affordances here so the create and edit flows
   * present the same UI. A full unification (shared <PhotoGrid> component) is
   * TODO — see the F5 fix log. */
  function removeImageAt(index: number) {
    const next = (imageUrls ?? []).filter((_, i) => i !== index);
    updateProperty.mutate({ image_urls: next });
  }

  function setImageAsMain(index: number) {
    if (index === 0) return;
    const urls = imageUrls ?? [];
    const next = [urls[index], ...urls.filter((_, i) => i !== index)];
    updateProperty.mutate({ image_urls: next });
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
      <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
        {/* Header row */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-[9px]" />
          <Skeleton className="h-8 w-36" />
        </div>

        {/* Photos card */}
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-5 w-20" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-xl" />
              ))}
            </div>
            <div aria-hidden="true" className="flex h-10 items-center justify-center rounded-[9px] border-2 border-dashed border-line bg-paper-2" />
          </div>
        </div>

        {/* Form cards with labeled inputs */}
        {Array.from({ length: 3 }, (_, cardIdx) => (
          <div key={cardIdx} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-5 w-28" />
              {Array.from({ length: 4 }, (_, rowIdx) => (
                <div key={rowIdx} className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-[9px]" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Save/Cancel buttons */}
        <div className="flex flex-col gap-2 pb-6">
          <Skeleton className="h-[52px] w-full rounded-[10px]" />
          <Skeleton className="h-[52px] w-full rounded-[10px]" />
        </div>
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
          onClick={() => navigate("/manage")}
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
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-h3">Photos</h2>
            {imageUrls.length > 1 ? (
              <div className="flex items-center gap-2">
                {multiSelect && selectedPhotoIndexes.length > 0 ? (
                  <span className="text-body-sm text-ink-2">
                    {selectedPhotoIndexes.length} selected
                  </span>
                ) : null}
                <Button
                  variant={multiSelect ? "primary" : "secondary"}
                  size="compact"
                  onClick={() => {
                    setMultiSelect((prev) => {
                      if (prev) setSelectedPhotoIndexes([]);
                      return !prev;
                    });
                  }}
                  aria-pressed={multiSelect}
                >
                  <Trash2 aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
                  {multiSelect ? "Exit select" : "Select to delete"}
                </Button>
              </div>
            ) : null}
          </div>
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {imageUrls.map((url, index) => {
                const isSelected = selectedPhotoIndexes.includes(index);
                return (
                  <div
                    key={`${url}-${index}`}
                    className={`group relative aspect-[4/3] overflow-hidden rounded-xl border bg-paper-2 ${
                      isSelected ? "border-accent ring-2 ring-accent" : "border-line"
                    }`}
                  >
                    <NetworkImage
                      alt={`Photo ${index + 1}`}
                      src={url}
                      wrapperClassName="h-full w-full rounded-xl"
                    />
                    {/* Multi-select checkbox */}
                    {multiSelect ? (
                      <button
                        type="button"
                        onClick={() => handleTogglePhoto(index)}
                        aria-pressed={isSelected}
                        aria-label={
                          isSelected
                            ? `Deselect photo ${index + 1}`
                            : `Select photo ${index + 1}`
                        }
                        className="absolute inset-0 z-10 flex items-start justify-end p-2"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected
                              ? "border-accent bg-accent text-white"
                              : "border-line bg-surface/80 text-ink-2"
                          }`}
                        >
                          {isSelected ? (
                            <svg
                              aria-hidden="true"
                              width="12"
                              height="12"
                              viewBox="0 0 14 14"
                              fill="none"
                            >
                              <path
                                d="M2 7L5.5 10.5L12 4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}
                        </span>
                      </button>
                    ) : (
                      /* Remove button (single mode) */
                      <button
                        type="button"
                        onClick={() => removeImageAt(index)}
                        disabled={updateProperty.isPending}
                        className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-paper opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
                        aria-label={`Remove photo ${index + 1}`}
                      >
                        <X aria-hidden="true" className="h-3 w-3" />
                      </button>
                    )}
                    {/* Set-as-main button (hidden when already main) */}
                    {!multiSelect && index !== 0 ? (
                      <button
                        type="button"
                        onClick={() => setImageAsMain(index)}
                        disabled={updateProperty.isPending}
                        className="absolute bottom-1 right-1 rounded bg-surface px-1.5 py-0.5 text-caption font-semibold text-accent shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
                      >
                        Set main
                      </button>
                    ) : null}
                    {/* Main badge */}
                    {index === 0 ? (
                      <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 text-caption font-semibold text-paper">
                        Main
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
          {multiSelect ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-paper-2 p-3">
              <span className="text-body-sm text-ink-2">
                {selectedPhotoIndexes.length} of {imageUrls.length} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="compact"
                  onClick={() => setSelectedPhotoIndexes([])}
                  disabled={selectedPhotoIndexes.length === 0}
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="compact"
                  onClick={handleDeleteSelectedPhotos}
                  disabled={
                    selectedPhotoIndexes.length === 0 ||
                    batchDeleteMedia.isPending
                  }
                >
                  {batchDeleteMedia.isPending
                    ? "Deleting…"
                    : `Delete ${selectedPhotoIndexes.length || ""}`.trim()}
                </Button>
              </div>
            </div>
          ) : null}
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
