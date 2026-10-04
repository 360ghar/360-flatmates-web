import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useCreateProperty, useUploadPropertyImage } from "@/features/listings/hooks/useProperties";
import { useDirtyFormGuard } from "@/hooks/useDirtyFormGuard";
import type { PropertyCreate } from "@/lib/api/types";
import { FURNISHING_LEVEL_VALUES } from "@/lib/data";
import { uiStore } from "@/lib/stores/ui-store";
import { userMessage } from "@/lib/api/errors";
import { LISTING_DRAFT_STORAGE_KEY } from "@/lib/schemas/listing-builder";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ListingBuilder, type ListingBuilderStep } from "@/features/hosting/components/ListingBuilder";
import { PostBasicInfoStep } from "@/features/hosting/components/post/PostBasicInfoStep";
import { PostLocationStep } from "@/features/hosting/components/post/PostLocationStep";
import { PostPropertyDetailsStep } from "@/features/hosting/components/post/PostPropertyDetailsStep";
import { PostRoomDetailsStep } from "@/features/hosting/components/post/PostRoomDetailsStep";
import { PostAmenitiesStep } from "@/features/hosting/components/post/PostAmenitiesStep";
import { PostPhotosStep } from "@/features/hosting/components/post/PostPhotosStep";
import { PostPreferencesStep } from "@/features/hosting/components/post/PostPreferencesStep";
import { PostReviewStep } from "@/features/hosting/components/post/PostReviewStep";
import { usePendingImages } from "@/features/hosting/hooks/usePendingImages";

const STEPS: ListingBuilderStep[] = [
  { id: "basics", label: "Basic information" },
  { id: "location", label: "Location" },
  { id: "property_details", label: "Property details" },
  { id: "room_details", label: "Room details" },
  { id: "amenities", label: "Amenities" },
  { id: "photos", label: "Photos" },
  { id: "preferences", label: "Preferences" },
  { id: "review", label: "Review and publish" }
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
const DRAFT_SAVE_DELAY_MS = 500;

/** Saves the draft without base64 photo previews. Returns false when storage fails. */
export function saveDraft(draft: DraftState): boolean {
  try {
    const form = { ...draft.form, image_urls: hostedImageUrls(draft.form.image_urls) ?? [] };
    window.localStorage.setItem(
      LISTING_DRAFT_STORAGE_KEY,
      JSON.stringify({ form, currentStep: draft.currentStep })
    );
    return true;
  } catch {
    return false;
  }
}

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
export function hostedImageUrls(urls: string[] | undefined): string[] | undefined {
  if (!urls || urls.length === 0) return undefined;
  const filtered = urls.filter(
    (u) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"))
  );
  return filtered.length > 0 ? filtered : undefined;
}

/** Returns true when the given step has all required fields filled in.
 *  Constraints mirror the Zod schema in `lib/schemas/listing-builder.ts`
 *  (propertyCreateSchema): title ≥ 5 chars, monthly_rent ≥ 500, city &
 *  locality non-empty, numeric fields within their schema bounds. The
 *  wizard never runs propertyCreateSchema itself, so out-of-range values
 *  would otherwise pass gating and fail with a 422 only at publish time. */
function isStepValid(step: number, form: Partial<PropertyCreate>): boolean {
  const inRange = (
    value: number | undefined,
    min: number,
    max: number
  ): boolean =>
    value === undefined || (Number.isFinite(value) && value >= min && value <= max);

  switch (step) {
    case 0:
      return (
        Boolean(form.title?.trim()) &&
        (form.title?.trim().length ?? 0) >= 5 &&
        Number.isFinite(form.monthly_rent) &&
        (form.monthly_rent ?? 0) >= 500 &&
        inRange(form.setup_cost, 0, Number.MAX_SAFE_INTEGER) &&
        inRange(form.other_charges, 0, Number.MAX_SAFE_INTEGER)
      );
    case 1:
      return Boolean(form.city?.trim()) && Boolean(form.locality?.trim());
    case 2:
      /* All fields optional per the schema; require bounds when set. */
      return (
        inRange(form.bedrooms, 0, 20) &&
        inRange(form.bathrooms, 0, 20) &&
        inRange(form.area_sqft, 0, Number.MAX_SAFE_INTEGER) &&
        inRange(form.security_deposit, 0, Number.MAX_SAFE_INTEGER) &&
        inRange(form.floor_number, 0, Number.MAX_SAFE_INTEGER) &&
        inRange(form.total_floors, 1, Number.MAX_SAFE_INTEGER) &&
        inRange(form.windows_count, 0, 100) &&
        inRange(form.ventilation_shafts, 0, 50)
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
  const { pendingImages, handleFiles, removeImage, retryImage } = usePendingImages(setForm);
  const [hasPublished, setHasPublished] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Persist the form + current step as a draft so a refresh mid-wizard does
     not lose progress. Only hosted photo URLs are saved: base64 previews are
     megabytes each and would exhaust the storage quota, so un-published
     photos must be re-added after a refresh. */
  const draftWarned = useRef(false);
  useEffect(() => {
    // After publish the draft is deleted; a save still pending must not restore it.
    if (hasPublished) return;
    const timer = window.setTimeout(() => {
      if (!saveDraft({ form, currentStep }) && !draftWarned.current) {
        draftWarned.current = true;
        uiStore.getState().pushToast({
          type: "warning",
          title: "Draft not saved",
          description: "Your browser storage is full or disabled. Finish the listing in this session."
        });
      }
    }, DRAFT_SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [form, currentStep, hasPublished]);

  // Uploads can outlast the page; do not pull a user who left back to review.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
      if (createProperty.isPending || uploadingPhotos) return; // guard against double-submit
      /* The furnishing dimension now lives in `furnishing_level`; drop legacy
         furnishing values from features[] so they are not sent twice. */
      const features =
        form.furnishing_level !== undefined
          ? (form.features ?? []).filter((f) => !FURNISHING_LEVEL_VALUES.some((level) => level === f))
          : form.features;
      const submissionPayload: PropertyCreate = {
        ...form,
        features,
        image_urls: hostedImageUrls(form.image_urls)
      } as PropertyCreate;
      createProperty.mutate(submissionPayload, {
        onSuccess: (property) => {
          try {
            window.localStorage.removeItem(LISTING_DRAFT_STORAGE_KEY);
          } catch {
            /* ignore */
          }
          /* Disable the dirty-form guard so the post-publish nav isn't blocked. */
          setHasPublished(true);
          void uploadPhotosThenLeave(property.id);
        },
        onError: (err) => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not publish listing",
            description: userMessage(err)
          });
        }
      });
    } else {
      setCurrentStep((s) => s + 1);
    }
  }

  /* Upload the processed photos, wait for all of them, then leave. Failed
     photos are reported; they can be added later from the listing page. */
  async function uploadPhotosThenLeave(propertyId: number) {
    const toUpload = pendingImages.filter((img) => !img.uploaded && img.preview);
    let failed = 0;
    if (toUpload.length > 0) {
      setUploadingPhotos(true);
      // Two at a time: each base64 body is large, and a slow uplink would
      // otherwise time out every upload together.
      let next = 0;
      const worker = async () => {
        while (next < toUpload.length) {
          const index = next++;
          try {
            await uploadImage.mutateAsync({
              propertyId,
              payload: { image_url: toUpload[index].preview, is_main: index === 0 }
            });
          } catch {
            failed += 1;
          }
        }
      };
      await Promise.all([worker(), worker()]);
      setUploadingPhotos(false);
    }
    uiStore.getState().pushToast(
      failed === 0
        ? { type: "success", title: "Listing published" }
        : {
            type: "warning",
            title: "Listing published",
            description: `${failed} of ${toUpload.length} photos did not upload. Add them again from your listing.`
          }
    );
    if (mounted.current) {
      navigate(`/post/review/${propertyId}`, { state: { listingId: propertyId, skipDirtyGuard: true } });
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
      nextLabel={currentStep >= STEPS.length - 1 ? "Publish listing" : "Next"}
      submitting={createProperty.isPending || uploadingPhotos}
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
          furnishingLevel={form.furnishing_level}
          featuresSet={featuresSet}
          onSharingTypeChange={(value) => patchForm({ sharing_type: value })}
          onFurnishingLevelChange={(value) => patchForm({ furnishing_level: value })}
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
          <Button variant="destructive"
            className="w-full md:w-auto"
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
