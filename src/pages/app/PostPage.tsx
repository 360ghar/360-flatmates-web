import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ImagePlus, X } from "lucide-react";
import { useCreateProperty, useUploadPropertyImage } from "@/hooks/queries";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useDirtyFormGuard } from "@/hooks/useDirtyFormGuard";
import type { PropertyCreate } from "@/lib/api/types";
import {
  LISTING_SHARING_TYPE_OPTIONS
} from "@/lib/data";
import { uiStore } from "@/lib/stores/ui-store";
import { humanizeSnakeCase, formatRent } from "@/lib/utils";
import { LISTING_DRAFT_STORAGE_KEY } from "@/lib/schemas/listing-builder";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { ListingBuilder, type ListingBuilderStep } from "@/components/organisms/ListingBuilder";

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

const SHARING_TYPE_OPTIONS = LISTING_SHARING_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label
}));

const GENDER_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "male", label: "Male only" },
  { value: "female", label: "Female only" }
] as const;

interface PendingImage {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
}

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

/** Coerce a numeric input to a number, mapping empty/NaN to undefined so a
 *  cleared field doesn't trip `Number.isFinite` validation. */
function optionalNumberValue(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
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
  // TODO: persisting File objects across refreshes is a known limitation. The
  // base64 data URLs survive in `form.image_urls` so the visible data isn't
  // lost, but on a refresh the user must re-select files to re-upload them.
  // A full fix would re-upload the data URLs as files on rehydration.
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
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
  const { upload: uploadImageFile } = useImageUpload();

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

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const newImages: PendingImage[] = await Promise.all(
      imageFiles.map(
        async (f) => {
          try {
            const preview = await uploadImageFile(f);
            return {
              id: `${f.name}-${crypto.randomUUID()}`,
              file: f,
              preview,
              uploaded: false,
              uploading: false
            };
          } catch {
            return {
              id: `${f.name}-${crypto.randomUUID()}`,
              file: f,
              preview: "",
              uploaded: false,
              uploading: false
            };
          }
        }
      )
    );
    setPendingImages((prev) => [...prev, ...newImages]);
    setForm((prev) => ({
      ...prev,
      image_urls: [
        ...(prev.image_urls ?? []),
        ...newImages.filter((i) => i.preview).map((i) => i.preview)
      ]
    }));
  }, [uploadImageFile]);

  function removeImage(id: string) {
    setPendingImages((prev) => {
      const next = prev.filter((i) => i.id !== id);
      setForm((f) => ({
        ...f,
        image_urls: next.filter((i) => i.preview).map((i) => i.preview)
      }));
      return next;
    });
  }

  /* Re-attempt the local conversion/encoding for an image that failed to preview. */
  const retryImage = useCallback(
    async (id: string) => {
      const target = pendingImages.find((i) => i.id === id);
      if (!target) return;
      setPendingImages((prev) => prev.map((i) => (i.id === id ? { ...i, uploading: true } : i)));
      try {
        const preview = await uploadImageFile(target.file);
        setPendingImages((prev) => {
          const next = prev.map((i) => (i.id === id ? { ...i, preview, uploading: false } : i));
          setForm((f) => ({ ...f, image_urls: next.filter((i) => i.preview).map((i) => i.preview) }));
          return next;
        });
      } catch {
        setPendingImages((prev) => prev.map((i) => (i.id === id ? { ...i, uploading: false } : i)));
        uiStore.getState().pushToast({
          type: "error",
          title: "Could not process photo",
          description: "Please try a different image."
        });
      }
    },
    [pendingImages, uploadImageFile]
  );

  function handleBack() {
    setShowStepError(false);
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      blocker.confirmNavigation(() => navigate("/manage"));
    }
  }

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
      {/* Step 1: Basic Info */}
      {currentStep === 0 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Basic Information</h2>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Title</span>
              <Input
                placeholder="e.g. Spacious 1BHK in DLF Phase 1"
                value={form.title ?? ""}
                aria-invalid={
                  showStepError &&
                  (!form.title?.trim() || (form.title?.trim().length ?? 0) < 5)
                    ? true
                    : undefined
                }
                onChange={(e) => patchForm({ title: e.target.value })}
              />
              {showStepError && (!form.title?.trim() || (form.title?.trim().length ?? 0) < 5) && (
                <span className="text-caption text-error">Title must be at least 5 characters.</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Monthly Rent</span>
              <Input
                type="number"
                placeholder="15000"
                value={form.monthly_rent !== undefined ? String(form.monthly_rent) : ""}
                aria-invalid={
                  showStepError &&
                  (!Number.isFinite(form.monthly_rent) || (form.monthly_rent ?? 0) < 500)
                    ? true
                    : undefined
                }
                onChange={(e) => patchForm({ monthly_rent: optionalNumberValue(e.target.value) })}
              />
              {showStepError &&
                (!Number.isFinite(form.monthly_rent) || (form.monthly_rent ?? 0) < 500) && (
                  <span className="text-caption text-error">
                    Enter a monthly rent of at least ₹500.
                  </span>
                )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Security Deposit</span>
              <Input
                type="number"
                placeholder="30000"
                value={form.security_deposit !== undefined ? String(form.security_deposit) : ""}
                onChange={(e) => patchForm({ security_deposit: optionalNumberValue(e.target.value) })}
              />
            </label>
          </div>
        </Card>
      )}

      {/* Step 2: Location */}
      {currentStep === 1 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Location</h2>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">City</span>
              <Input
                placeholder="Gurugram"
                value={form.city ?? ""}
                aria-invalid={showStepError && !form.city?.trim() ? true : undefined}
                onChange={(e) => patchForm({ city: e.target.value })}
              />
              {showStepError && !form.city?.trim() && (
                <span className="text-caption text-error">City is required.</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Locality</span>
              <Input
                placeholder="DLF Phase 1"
                value={form.locality ?? ""}
                aria-invalid={showStepError && !form.locality?.trim() ? true : undefined}
                onChange={(e) => patchForm({ locality: e.target.value })}
              />
              {showStepError && !form.locality?.trim() && (
                <span className="text-caption text-error">Locality is required.</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Address</span>
              <Input
                placeholder="Full address"
                value={form.address ?? ""}
                onChange={(e) => patchForm({ address: e.target.value })}
              />
            </label>
          </div>
        </Card>
      )}

      {/* Step 3: Property Details */}
      {currentStep === 2 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Property Details</h2>
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Description</span>
              <textarea
                className="min-h-[100px] w-full resize-y rounded-[8px] border border-line bg-surface px-3 py-2.5 text-body-md text-ink placeholder:text-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                placeholder="Describe your listing..."
                value={form.description ?? ""}
                onChange={(e) => patchForm({ description: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-label-md text-ink-2">Bedrooms</span>
                <Input
                  type="number"
                  placeholder="1"
                  value={form.bedrooms !== undefined ? String(form.bedrooms) : ""}
                  onChange={(e) => patchForm({ bedrooms: optionalNumberValue(e.target.value) })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-label-md text-ink-2">Bathrooms</span>
                <Input
                  type="number"
                  placeholder="1"
                  value={form.bathrooms !== undefined ? String(form.bathrooms) : ""}
                  onChange={(e) => patchForm({ bathrooms: optionalNumberValue(e.target.value) })}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-label-md text-ink-2">Area (sq ft)</span>
                <Input
                  type="number"
                  placeholder="800"
                  value={form.area_sqft !== undefined ? String(form.area_sqft) : ""}
                  onChange={(e) => patchForm({ area_sqft: optionalNumberValue(e.target.value) })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-label-md text-ink-2">Available From</span>
                <Input
                  type="date"
                  value={form.available_from ?? ""}
                  onChange={(e) => patchForm({ available_from: e.target.value })}
                />
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Room Details */}
      {currentStep === 3 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Room Details</h2>
          <div className="flex flex-col gap-4">
            <div role="radiogroup" aria-labelledby="sharing-type-label">
              <p id="sharing-type-label" className="text-label-md text-ink-2 mb-2">Sharing Type</p>
              <div className="flex flex-wrap gap-2">
                {SHARING_TYPE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    variant="choice"
                    selected={form.sharing_type === opt.value}
                    onClick={() => patchForm({ sharing_type: opt.value as PropertyCreate["sharing_type"] })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div role="group" aria-labelledby="furnishing-tags-label">
              <p id="furnishing-tags-label" className="text-label-md text-ink-2 mb-2">Furnishing Tags</p>
              <div className="flex flex-wrap gap-2">
                {["furnished", "semi_furnished", "unfurnished", "bed", "wardrobe", "wifi", "ac", "washing_machine", "tv", "fridge"].map((tag) => (
                  <Chip
                    key={tag}
                    selected={(form.features ?? []).includes(tag)}
                    onClick={() => toggleArrayItem("features", tag)}
                  >
                    {humanizeSnakeCase(tag)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 5: Amenities */}
      {currentStep === 4 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Amenities</h2>
          <div className="flex flex-col gap-4">
            <div role="group" aria-labelledby="society-amenities-label">
              <p id="society-amenities-label" className="text-label-md text-ink-2 mb-2">Society Amenities</p>
              <div className="flex flex-wrap gap-2">
                {["gym", "pool", "parking", "security", "power_backup", "lift", "garden", "clubhouse", "intercom", "cctv"].map((amenity) => (
                  <Chip
                    key={amenity}
                    selected={(form.society_amenities ?? []).includes(amenity)}
                    onClick={() => toggleArrayItem("society_amenities", amenity)}
                  >
                    {humanizeSnakeCase(amenity)}
                  </Chip>
                ))}
              </div>
            </div>
            <div role="group" aria-labelledby="vibe-tags-label">
              <p id="vibe-tags-label" className="text-label-md text-ink-2 mb-2">Vibe Tags</p>
              <div className="flex flex-wrap gap-2">
                {["quiet", "social", "family_friendly", "pet_friendly", "young_crowd", "luxury", "budget_friendly"].map((tag) => (
                  <Chip
                    key={tag}
                    selected={(form.society_vibe_tags ?? []).includes(tag)}
                    onClick={() => toggleArrayItem("society_vibe_tags", tag)}
                  >
                    {humanizeSnakeCase(tag)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 6: Photos */}
      {currentStep === 5 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Photos</h2>
          <p className="text-body-md text-ink-2">
            Add photos to make your listing stand out. You can add more after publishing.
          </p>

          {/* Upload zone */}
          <Button
            aria-label="Choose listing photos"
            variant="secondary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper-2 text-ink-3 hover:border-accent/50 hover:bg-accent-soft"
          >
            <ImagePlus aria-hidden="true" className="h-6 w-6" />
            <span className="text-body-md">Click to upload photos</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            aria-label="Listing photos"
            className="sr-only"
            onChange={(e) => {
              const { files } = e.currentTarget;
              void handleFiles(files);
              e.currentTarget.value = "";
            }}
          />

          {/* Previews */}
          {pendingImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pendingImages.map((img, index) => (
                <div
                  key={img.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-paper-2"
                >
                  {img.preview ? (
                    <NetworkImage
                      alt={`Listing photo ${index + 1} preview`}
                      src={img.preview}
                      wrapperClassName="h-full w-full rounded-xl"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-error-soft px-2 text-center">
                      <span className="text-caption text-error">Could not load</span>
                    </div>
                  )}
                  {/* Uploading overlay */}
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                      <Skeleton variant="block" className="h-4 w-16 rounded" />
                    </div>
                  )}
                  {/* Retry control for a photo that failed to process */}
                  {!img.uploading && !img.preview && (
                    <button
                      type="button"
                      onClick={() => retryImage(img.id)}
                      className="absolute bottom-2 right-2 min-h-9 rounded-[8px] bg-surface px-3 py-1.5 text-caption font-semibold text-accent shadow-sm hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      Retry
                    </button>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-ink/70 text-paper opacity-100 transition-opacity hover:bg-ink/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                    aria-label={`Remove photo ${index + 1}`}
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                  {/* Main badge */}
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 text-caption font-semibold text-paper">
                      Main
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {pendingImages.length === 0 && (
            <p className="text-body-md text-ink-3 text-center">
              No photos selected yet. The first photo will be your main image.
            </p>
          )}
        </Card>
      )}

      {/* Step 7: Preferences */}
      {currentStep === 6 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Preferences</h2>
          <div className="flex flex-col gap-4">
            <div role="radiogroup" aria-labelledby="gender-preference-label">
              <p id="gender-preference-label" className="text-label-md text-ink-2 mb-2">Gender Preference</p>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    variant="choice"
                    selected={form.gender_preference === opt.value}
                    onClick={() => patchForm({ gender_preference: opt.value as PropertyCreate["gender_preference"] })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div role="group" aria-labelledby="additional-tags-label">
              <p id="additional-tags-label" className="text-label-md text-ink-2 mb-2">Additional Tags</p>
              <div className="flex flex-wrap gap-2">
                {["veg_only", "no_smoking", "no_drinking", "no_pets", "early_riser", "night_owl"].map((tag) => (
                  <Chip
                    key={tag}
                    selected={(form.tags ?? []).includes(tag)}
                    onClick={() => toggleArrayItem("tags", tag)}
                  >
                    {humanizeSnakeCase(tag)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Step 8: Review & Publish */}
      {currentStep === 7 && (
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-h3">Review & Publish</h2>
          <div className="flex flex-col gap-2 text-body-md text-ink-2">
            <p><span className="font-semibold text-ink">Title:</span> {form.title ?? "Not set"}</p>
            <p><span className="font-semibold text-ink">Rent:</span> {form.monthly_rent ? formatRent(form.monthly_rent) : "Not set"}</p>
            <p><span className="font-semibold text-ink">City:</span> {form.city ?? "Not set"}</p>
            <p><span className="font-semibold text-ink">Locality:</span> {form.locality ?? "Not set"}</p>
            <p><span className="font-semibold text-ink">Bedrooms:</span> {form.bedrooms ?? "Not set"}</p>
            <p><span className="font-semibold text-ink">Sharing Type:</span> {form.sharing_type ?? "Not set"}</p>
            <p><span className="font-semibold text-ink">Gender Preference:</span> {form.gender_preference ?? "Not set"}</p>
            <p><span className="font-semibold text-ink">Photos:</span> {pendingImages.length > 0 ? `${pendingImages.length} photo${pendingImages.length > 1 ? "s" : ""} selected` : "None"}</p>
            {(form.features?.length ?? 0) > 0 && (
              <p><span className="font-semibold text-ink">Features:</span> {form.features?.join(", ")}</p>
            )}
            {(form.society_amenities?.length ?? 0) > 0 && (
              <p><span className="font-semibold text-ink">Amenities:</span> {form.society_amenities?.join(", ")}</p>
            )}
          </div>
          {pendingImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {pendingImages.map((img, index) => (
                <div key={img.id} className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-line">
                  <NetworkImage
                    alt={`Selected listing photo ${index + 1}`}
                    src={img.preview}
                    wrapperClassName="h-full w-full rounded-lg"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>
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
