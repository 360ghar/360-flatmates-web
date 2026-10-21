import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useUpdateProperty } from "@/features/listings/hooks/useProperties";
import { useListingPhotoUpload } from "@/features/hosting/hooks/useListingPhotoUpload";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ListingPhotoGridItem } from "./ListingPhotoGridItem";

/**
 * Photos of a listing: add, remove one or several, or choose the main photo.
 * The backend takes photos as hosted URLs, so a new photo is uploaded first
 * (`POST /upload`) and the whole list goes back as `image_urls`.
 */
export function ListingPhotoManager({
  propertyId,
  imageUrls,
  goesBackToReview = false
}: {
  propertyId: number;
  imageUrls: string[];
  /** The listing is live: a photo change is a content edit and sends it back to review. */
  goesBackToReview?: boolean;
}) {
  const updateProperty = useUpdateProperty(propertyId);
  const { upload, uploadingCount } = useListingPhotoUpload();
  // An upload can outlast a refetch: append to the newest list, not the one at pick time.
  const imageUrlsRef = useRef(imageUrls);
  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  // An upload commits its list when it ends: until then a remove, reorder or delete would be lost or undone.
  const photoEditsLocked = updateProperty.isPending || uploadingCount > 0;

  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedPhotoIndexes, setSelectedPhotoIndexes] = useState<Set<number>>(new Set());

  const handleTogglePhoto = (index: number) => {
    setSelectedPhotoIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  function savePhotos(next: string[], failureTitle: string, onDone?: () => void) {
    updateProperty.mutate(
      { image_urls: next },
      {
        onSuccess: onDone,
        onError: () => {
          uiStore.getState().pushToast({ type: "error", title: failureTitle });
        }
      }
    );
  }

  const handleDeleteSelectedPhotos = () => {
    if (selectedPhotoIndexes.size === 0) return;
    const remaining = imageUrls.filter((_, i) => !selectedPhotoIndexes.has(i));
    savePhotos(remaining, "Could not remove photos from listing", () => {
      setSelectedPhotoIndexes(new Set());
      setMultiSelect(false);
    });
  };

  async function addPhotos(files: File[]) {
    const { urls, failed } = await upload(files);
    if (urls.length > 0) savePhotos([...imageUrlsRef.current, ...urls], "Could not add photos");
    if (failed > 0) {
      uiStore.getState().pushToast({
        type: "error",
        title: failed === 1 ? "A photo did not upload" : `${failed} photos did not upload`,
        description: "Check your connection and try again."
      });
    }
  }

  function removeImageAt(index: number) {
    savePhotos(
      imageUrls.filter((_, i) => i !== index),
      "Could not remove photo"
    );
  }

  function setImageAsMain(index: number) {
    if (index === 0) return;
    savePhotos(
      [imageUrls[index], ...imageUrls.filter((_, i) => i !== index)],
      "Could not change the main photo"
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h3 text-ink">Photos</h2>
        {imageUrls.length > 1 ? (
          <div className="flex items-center gap-2">
            {multiSelect && selectedPhotoIndexes.size > 0 ? (
              <span className="text-body-sm text-ink-2">
                {selectedPhotoIndexes.size} selected
              </span>
            ) : null}
            <Button
              variant={multiSelect ? "primary" : "secondary"}
              size="compact"
              onClick={() => {
                if (multiSelect) setSelectedPhotoIndexes(new Set());
                setMultiSelect((prev) => !prev);
              }}
              aria-pressed={multiSelect}
            >
              <Trash2 aria-hidden="true" className="mr-1 h-3.5 w-3.5" />
              {multiSelect ? "Exit select" : "Select to delete"}
            </Button>
          </div>
        ) : null}
      </div>
      {goesBackToReview ? (
        <p className="text-body-sm text-ink-3" role="note">
          Adding or removing a photo, or changing the main photo, sends your live listing back to review.
        </p>
      ) : null}
      {imageUrls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageUrls.map((url, index) => (
            <ListingPhotoGridItem
              key={url}
              url={url}
              index={index}
              isSelected={selectedPhotoIndexes.has(index)}
              multiSelect={multiSelect}
              removeDisabled={photoEditsLocked}
              setMainDisabled={photoEditsLocked}
              onToggleSelect={() => handleTogglePhoto(index)}
              onRemove={() => removeImageAt(index)}
              onSetMain={() => setImageAsMain(index)}
            />
          ))}
        </div>
      ) : (
        <p className="text-body-md text-ink-3">This listing has no photos.</p>
      )}
      {multiSelect ? (
        <div className="flex items-center justify-between gap-2 rounded-cut-md bg-surface-soft p-3">
          <span className="text-body-sm text-ink-2">
            {selectedPhotoIndexes.size} of {imageUrls.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="compact"
              onClick={() => setSelectedPhotoIndexes(new Set())}
              disabled={selectedPhotoIndexes.size === 0}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="compact"
              onClick={handleDeleteSelectedPhotos}
              disabled={selectedPhotoIndexes.size === 0 || photoEditsLocked}
            >
              {updateProperty.isPending
                ? "Deleting…"
                : `Delete ${selectedPhotoIndexes.size || ""}`.trim()}
            </Button>
          </div>
        </div>
      ) : null}
      <label
        className={`flex items-center justify-center gap-2 rounded-cut-md border-2 border-dashed border-line bg-surface-soft px-4 py-3 text-body-md text-ink-2 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
          uploadingCount > 0 ? "cursor-progress" : "cursor-pointer hover:border-accent/40 hover:bg-accent-soft"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={uploadingCount > 0}
          onChange={(e) => {
            void addPhotos(Array.from(e.currentTarget.files ?? []));
            e.currentTarget.value = "";
          }}
        />
        <span role="status">
          {uploadingCount > 0 ? `Uploading ${uploadingCount} photo${uploadingCount > 1 ? "s" : ""}…` : "Add photos"}
        </span>
      </label>
    </Card>
  );
}
