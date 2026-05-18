import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ImagePlus, X } from "lucide-react";
import { useCreateProperty, useUploadPropertyImage } from "@/hooks/queries";
import { useImageUpload } from "@/hooks/useImageUpload";
import type { PropertyCreate } from "@/lib/api/types";
import {
  LISTING_SHARING_TYPE_OPTIONS
} from "@/lib/data";
import { uiStore } from "@/lib/stores/ui-store";
import { humanizeSnakeCase, formatRent } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
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

export function PostPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<Partial<PropertyCreate>>({
    property_type: "flatmate",
    purpose: "rent",
    features: [],
    tags: [],
    society_amenities: [],
    society_vibe_tags: [],
    image_urls: []
  });
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createProperty = useCreateProperty();
  const uploadImage = useUploadPropertyImage();
  const { upload: uploadImageFile } = useImageUpload();

  function patchForm(patch: Partial<PropertyCreate>) {
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
    if (currentStep >= STEPS.length - 1) {
      createProperty.mutate(form as PropertyCreate, {
        onSuccess: (property) => {
          /* Upload pending images after the property is created */
          const unuploaded = pendingImages.filter((img) => !img.uploaded && !img.uploading);
          if (unuploaded.length > 0 && property.id) {
            unuploaded.forEach((img) => {
              setPendingImages((prev) =>
                prev.map((i) => (i.id === img.id ? { ...i, uploading: true } : i))
              );
              uploadImage.mutate(
                {
                  propertyId: property.id,
                  payload: { image_url: img.preview, is_main: pendingImages.indexOf(img) === 0 }
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
          navigate("/post/review");
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
    setPendingImages((prev) => prev.filter((i) => i.id !== id));
    setForm((prev) => ({
      ...prev,
      image_urls: pendingImages.filter((i) => i.id !== id).map((i) => i.preview)
    }));
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    } else {
      navigate("/manage");
    }
  }

  return (
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
                onChange={(e) => patchForm({ title: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Monthly Rent</span>
              <Input
                type="number"
                placeholder="15000"
                value={form.monthly_rent ? String(form.monthly_rent) : ""}
                onChange={(e) => patchForm({ monthly_rent: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Security Deposit</span>
              <Input
                type="number"
                placeholder="30000"
                value={form.security_deposit ? String(form.security_deposit) : ""}
                onChange={(e) => patchForm({ security_deposit: Number(e.target.value) })}
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
                onChange={(e) => patchForm({ city: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-label-md text-ink-2">Locality</span>
              <Input
                placeholder="DLF Phase 1"
                value={form.locality ?? ""}
                onChange={(e) => patchForm({ locality: e.target.value })}
              />
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
                className="min-h-[100px] w-full resize-y rounded-[9px] border border-line bg-surface px-3 py-2.5 text-body-md text-ink placeholder:text-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
                  value={form.bedrooms ? String(form.bedrooms) : ""}
                  onChange={(e) => patchForm({ bedrooms: Number(e.target.value) })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-label-md text-ink-2">Bathrooms</span>
                <Input
                  type="number"
                  placeholder="1"
                  value={form.bathrooms ? String(form.bathrooms) : ""}
                  onChange={(e) => patchForm({ bathrooms: Number(e.target.value) })}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-label-md text-ink-2">Area (sq ft)</span>
                <Input
                  type="number"
                  placeholder="800"
                  value={form.area_sqft ? String(form.area_sqft) : ""}
                  onChange={(e) => patchForm({ area_sqft: Number(e.target.value) })}
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
            <div>
              <p className="text-label-md text-ink-2 mb-2">Sharing Type</p>
              <div className="flex flex-wrap gap-2">
                {SHARING_TYPE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    selected={form.sharing_type === opt.value}
                    onClick={() => patchForm({ sharing_type: opt.value as PropertyCreate["sharing_type"] })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label-md text-ink-2 mb-2">Furnishing Tags</p>
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
            <div>
              <p className="text-label-md text-ink-2 mb-2">Society Amenities</p>
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
            <div>
              <p className="text-label-md text-ink-2 mb-2">Vibe Tags</p>
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
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Previews */}
          {pendingImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {pendingImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-paper-2"
                >
                  <NetworkImage
                    alt="Listing photo preview"
                    src={img.preview}
                    wrapperClassName="h-full w-full rounded-xl"
                  />
                  {/* Uploading overlay */}
                  {img.uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink/40">
                      <Skeleton variant="block" className="h-4 w-16 rounded" />
                    </div>
                  )}
                  {/* Failed badge */}
                  {!img.uploading && !img.uploaded && pendingImages.indexOf(img) > 0 && (
                    <div className="absolute bottom-1 right-1 rounded bg-error-soft px-1.5 py-0.5 text-caption text-error">
                      retry
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-paper opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label="Remove photo"
                  >
                    <X aria-hidden="true" className="h-3 w-3" />
                  </button>
                  {/* Main badge */}
                  {pendingImages.indexOf(img) === 0 && (
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
            <div>
              <p className="text-label-md text-ink-2 mb-2">Gender Preference</p>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.value}
                    selected={form.gender_preference === opt.value}
                    onClick={() => patchForm({ gender_preference: opt.value as PropertyCreate["gender_preference"] })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-label-md text-ink-2 mb-2">Additional Tags</p>
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
              {pendingImages.map((img) => (
                <div key={img.id} className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-line">
                  <NetworkImage alt="Preview" src={img.preview} wrapperClassName="h-full w-full rounded-lg" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </ListingBuilder>
  );
}
