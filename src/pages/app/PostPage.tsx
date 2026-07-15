import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCreateProperty, useUploadPropertyImage } from "@/hooks/queries";
import { useDirtyFormGuard } from "@/hooks/useDirtyFormGuard";
import type { PropertyCreate } from "@/lib/api/types";
import { uiStore } from "@/lib/stores/ui-store";
import { LISTING_DRAFT_STORAGE_KEY } from "@/lib/schemas/listing-builder";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ListingBuilder, type ListingBuilderStep } from "@/components/organisms/ListingBuilder";
import { PostBasicInfoStep } from "./PostBasicInfoStep";
import { PostLocationStep } from "./PostLocationStep";
import { PostPropertyDetailsStep } from "./PostPropertyDetailsStep";
import { PostRoomDetailsStep } from "./PostRoomDetailsStep";
import { PostAmenitiesStep } from "./PostAmenitiesStep";
import { PostPhotosStep } from "./PostPhotosStep";
import { PostPreferencesStep } from "./PostPreferencesStep";
import { PostReviewStep } from "./PostReviewStep";
import { usePendingImages } from "./usePendingImages";

const STEPS: ListingBuilderStep[] = [
  { id: "basics", label: "Basic Info" },
  { id: "location", label: "Location" },
  { id: "property_details", label: "Property Details" },
  { id: "room_details", label: "Room Details" },
  { id: "amenities", label: "Amenities" },
  { id: "photos", label: "Photos" },
  { id: "preferences", label: "Preferences" },
  { id: "review", label: "Review & Publish" }
];

interface DraftState {
  form: Partial<PropertyCreate>;
  currentStep: number;
}

const DEFAULT_FORM: Partial<PropertyCreate> = {
  property_type: "flatmate",
  purpose: "rent",
  features: [],
  tags: [],
  society_amenities: [],
  society_vibe_tags: [],
  image_urls: []
};

const DEFAULT_DRAFT: DraftState = { form: DEFAULT_FORM, currentStep: 0 };

function loadDraft(): DraftState {
  if (typeof window === "undefined") return DEFAULT_DRAFT;
  try {
    const raw = window.localStorage.getItem(LISTING_DRAFT_STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    const parsed = JSON.parse(raw) as Partial<DraftState>;
    return {
      form: { ...DEFAULT_FORM, ...(parsed.form ?? {}) },
      currentStep:
        typeof parsed.currentStep === "number" && parsed.currentStep >= 0
          ? Math.min(parsed.currentStep, STEPS.length - 1)
          : 0
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

/** Returns only hosted http(s) URLs, filtering out base64 data URLs and blob: previews
 *  that the backend's `format: uri` validation would reject with a 422. */
function hostedImageUrls(urls: string[] | undefined): string[] | undefined {
  if (!urls || urls.length === 0) return undefined;
  const filtered = urls.filter(
    (u) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))
  );
  return filtered.length > 0 ? filtered : undefined;
}

/** Returns true when the given step has all required fields filled in.
 *  Constraints mirror the Zod schema in `lib/schemas/listing-builder.ts`
 *  (propertyCreateSchema): title ≥ 5 chars, monthly_rent ≥ 500, city &
 *  locality non-empty. All other fields are optional. */
function isStepValid(step: number, form: Partial<PropertyCreate>): boolean {
  switch (step) {
    case 0:
      return (
        Boolean(form.title?.trim()) &&
        (form.title?.trim().length ?? 0) >= 5 &&
        Number.isFinite(form.monthly_rent) &&
        (form.monthly_rent ?? 0) >= 500
      );
    case 1:
      return Boolean(form.city?.trim()) && Boolean(form.locality?.trim());
    case 2:
      /* All fields optional per the schema; only require numbers when set. */
      return (
        (form.bedrooms === undefined || Number.isFinite(form.bedrooms)) &&
        (form.bathrooms === undefined || Number.isFinite(form.bathrooms)) &&
        (form.area_sqft === undefined || Number.isFinite(form.area_sqft)) &&
        (form.security_deposit === undefined || Number.isFinite(form.security_deposit))
      );
    case 3:
    case 4:
    case 5:
    case 6:
      return true;
    case 7:
      return isStepValid(0, form) && isStepValid(1, form);
    default:
      return true;
  }
}

export function PostPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(() => loadDraft().currentStep);
  const [form, setForm] = useState<Partial<PropertyCreate>>(() => loadDraft().form);
  const [showStepError, setShowStepError] = useState(false);
  const { pendingImages, setPendingImages, handleFiles, removeImage, retryImage } = usePendingImages(setForm);
  const [hasPublished, setHasPublished] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Persist the form + current step as a draft so a refresh mid-wizard does
     not lose progress. Image File objects are not serialised; the base64
     data URLs stay in `form.image_urls` and are re-uploaded on publish. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const draft: DraftState = { form, currentStep };
      window.localStorage.setItem(LISTING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* storage may be unavailable (private mode); fail silently */
    }
  }, [form, currentStep]);

  const createProperty = useCreateProperty();
  const uploadImage = useUploadPropertyImage();

  /* Treat the wizard as "dirty" any time the user has entered something
     beyond the defaults. The guard stays armed until the property is
     successfully created (then `hasPublished` flips and the guard relaxes). */
  const isDirty =
    !hasPublished &&
    (currentStep > 0 ||
      Boolean(form.title?.trim()) ||
      Boolean(form.city?.trim()) ||
      Boolean(form.locality?.trim()) ||
      typeof form.monthly_rent === "number" ||
      (form.image_urls?.length ?? 0) > 0);

  const blocker = useDirtyFormGuard(
    isDirty && !createProperty.isPending,
    "You have unsaved listing changes. Leaving will discard them."
  );

  function patchForm(patch: Partial<PropertyCreate>) {
    setShowStepError(false);
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function toggleArrayItem(
    field: "features" | "tags" | "society_amenities" | "society_vibe_tags",
    value: string
  ) {
    setForm((prev) => {
      const current = prev[field] ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [field]: next };
    });
  }

  function handleNext() {
    if (!isStepValid(currentStep, form)) {
      setShowStepError(true);
      return;
    }
    setShowStepError(false);

    if (currentStep >= STEPS.length - 1) {
      if (createProperty.isPending) return; // guard against double-submit
      const submissionPayload: PropertyCreate = {
        ...form,
        image_urls: hostedImageUrls(form.image_urls)
      } as PropertyCreate;
      createProperty.mutate(submissionPayload, {
        onSuccess: (property) => {
          /* Clear the saved draft now that the listing is published */
          try {
            window.localStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          /* Disable the dirty-form guard so the post-publish nav isn't blocked. */
          setHasPublished(true);
          /* Upload pending images after the property is created (skip ones that failed to process) */
          const unuploaded = pendingImages.filter(
            (img) => !img.uploaded && !img.uploading && img.preview
          );
          if (unuploaded.length > 0 && property.id) {
            unuploaded.forEach((img, imgIndex) => {
              setPendingImages((prev) =>
                prev.map((i) => (i.id === img.id ? { ...i, uploading: true } : i))
              );
              uploadImage.mutate(
                {
                  propertyId: property.id,
                  payload: { image_url: img.preview, is_main: imgIndex === 0 }
                },
                {
                  onSuccess: () => {
                    setPendingImages((prev) =>
                      prev.map((i) => (i.id === img.id ? { ...i, uploaded: true, uploading: false } : i))
                    );
                  },
                  onError: () => {
                    setPendingImages((prev) =>
                      prev.map((i) => (i.id === img.id ? { ...i, uploading: false } : i))
                    );
                  }
                }
              );
            });
            uiStore.getState().pushToast({
              type: "success",
              title: "Listing published",
              description: "Photos are uploading in the background."
            });
          } else {
            uiStore.getState().pushToast({
              type: "success",
              title: "Listing published"
            });
          }
          navigate(`/post/review/${property.id}`, { state: { listingId: property.id } });
        },
        onError: (err) => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not publish listing",
            description: err instanceof Error ? err.message : "Please try again."
          });
        }
      });
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setShowStepError(false);
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      blocker.confirmNavigation(() => navigate("/manage"));
    }
  }

  const featuresSet = new Set(form.features ?? []);
  const societyAmenitiesSet = new Set(form.society_amenities ?? []);

  return (
    <div className="flex flex-col">
    <ListingBuilder
      steps={STEPS}
      currentStep={currentStep}
      onNext={handleNext}
      onBack={handleBack}
      nextLabel={currentStep >= STEPS.length - 1 ? "Publish Listing" : "Next"}
      submitting={createProperty.isPending}
    >
      {currentStep === 0 && (
        <PostBasicInfoStep form={form} showStepError={showStepError} onChange={patchForm} />
      )}

      {currentStep === 1 && (
        <PostLocationStep form={form} showStepError={showStepError} onChange={patchForm} />
      )}

      {currentStep === 2 && (
        <PostPropertyDetailsStep form={form} onChange={patchForm} />
      )}

      {currentStep === 3 && (
        <PostRoomDetailsStep
          sharingType={form.sharing_type}
          featuresSet={featuresSet}
          onSharingTypeChange={(value) => patchForm({ sharing_type: value })}
          onToggleFeature={(tag) => toggleArrayItem("features", tag)}
        />
      )}

      {currentStep === 4 && (
        <PostAmenitiesStep
          societyAmenitiesSet={societyAmenitiesSet}
          vibeTags={form.society_vibe_tags ?? []}
          onToggleAmenity={(amenity) => toggleArrayItem("society_amenities", amenity)}
          onToggleVibeTag={(tag) => toggleArrayItem("society_vibe_tags", tag)}
        />
      )}

      {currentStep === 5 && (
        <PostPhotosStep
          pendingImages={pendingImages}
          fileInputRef={fileInputRef}
          onFilesSelected={(files) => void handleFiles(files)}
          onRetryImage={retryImage}
          onRemoveImage={removeImage}
        />
      )}

      {currentStep === 6 && (
        <PostPreferencesStep
          genderPreference={form.gender_preference}
          tags={form.tags ?? []}
          onGenderPreferenceChange={(value) => patchForm({ gender_preference: value })}
          onToggleTag={(tag) => toggleArrayItem("tags", tag)}
        />
      )}

      {currentStep === 7 && (
        <PostReviewStep form={form} pendingImages={pendingImages} />
      )}
    </ListingBuilder>
    <Modal
      open={blocker.state === "blocked"}
      onClose={() => blocker.reset?.()}
      title="Discard unsaved listing?"
      description="Your listing draft is saved locally, but leaving this page will leave the wizard. You can return any time before publishing."
      footer={
        <>
          <Button variant="secondary" onClick={() => blocker.reset?.()} className="w-full md:w-auto">
            Keep editing
          </Button>
          <Button
            variant="primary"
            className="w-full bg-error text-white hover:bg-error/95 md:w-auto"
            onClick={() => blocker.proceed?.()}
          >
            Leave page
          </Button>
        </>
      }
    />
    </div>
  );
}
