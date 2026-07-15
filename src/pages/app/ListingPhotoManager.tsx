import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  useBatchDeleteMedia,
  useUpdateProperty,
  useUploadPropertyImage
} from "@/hooks/queries";
import { useImageUpload } from "@/hooks/useImageUpload";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ListingPhotoGridItem } from "./ListingPhotoGridItem";

export function ListingPhotoManager({
  propertyId,
  imageUrls
}: {
  propertyId: number;
  imageUrls: string[];
}) {
  const updateProperty = useUpdateProperty(propertyId);
  const uploadImage = useUploadPropertyImage();
  const batchDeleteMedia = useBatchDeleteMedia();
  const { upload: uploadImageFile } = useImageUpload();

  const [imageUploading, setImageUploading] = useState(false);
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

  const handleDeleteSelectedPhotos = () => {
    const selected = imageUrls.filter((_, i) => selectedPhotoIndexes.has(i));
    if (selected.length === 0) return;

    const remaining = imageUrls.filter((_, i) => !selectedPhotoIndexes.has(i));

    // Update the listing first so the UI is never out of sync with the
    // property record, then best-effort delete the underlying storage files.
    updateProperty.mutate(
      { image_urls: remaining },
      {
        onSuccess: () => {
          setSelectedPhotoIndexes(new Set());
          setMultiSelect(false);
          batchDeleteMedia.mutate(
            { media_ids: selected },
            {
              onSuccess: (result) => {
                uiStore.getState().pushToast({
                  type: result.failed.length === 0 ? "success" : "warning",
                  title: `Deleted ${result.deleted.length} photo${result.deleted.length === 1 ? "" : "s"}`,
                  description:
                    result.failed.length > 0
                      ? `${result.failed.length} could not be removed`
                      : undefined
                });
              },
              onError: () => {
                uiStore.getState().pushToast({
                  type: "warning",
                  title: "Photos removed from listing",
                  description: "Some files could not be deleted from storage."
                });
              }
            }
          );
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not remove photos from listing"
          });
        }
      }
    );
  };

  function removeImageAt(index: number) {
    const url = imageUrls[index];
    const next = imageUrls.filter((_, i) => i !== index);
    if (!url) {
      updateProperty.mutate({ image_urls: next });
      return;
    }
    updateProperty.mutate(
      { image_urls: next },
      {
        onSuccess: () => {
          batchDeleteMedia.mutate(
            { media_ids: [url] },
            {
              onError: () => {
                uiStore.getState().pushToast({
                  type: "warning",
                  title: "Photo removed from listing",
                  description: "The file could not be deleted from storage."
                });
              }
            }
          );
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not remove photo"
          });
        }
      }
    );
  }

  function setImageAsMain(index: number) {
    if (index === 0) return;
    const next = [imageUrls[index], ...imageUrls.filter((_, i) => i !== index)];
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
          payload: { image_url: dataUrl, is_main: imageUrls.length === 0 }
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

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h3">Photos</h2>
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
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageUrls.map((url, index) => (
            <ListingPhotoGridItem
              key={url}
              url={url}
              index={index}
              isSelected={selectedPhotoIndexes.has(index)}
              multiSelect={multiSelect}
              removeDisabled={updateProperty.isPending || batchDeleteMedia.isPending}
              setMainDisabled={updateProperty.isPending}
              onToggleSelect={() => handleTogglePhoto(index)}
              onRemove={() => removeImageAt(index)}
              onSetMain={() => setImageAsMain(index)}
            />
          ))}
        </div>
      )}
      {multiSelect ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-paper-2 p-3">
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
              disabled={
                selectedPhotoIndexes.size === 0 ||
                updateProperty.isPending ||
                batchDeleteMedia.isPending
              }
            >
              {updateProperty.isPending || batchDeleteMedia.isPending
                ? "Deleting…"
                : `Delete ${selectedPhotoIndexes.size || ""}`.trim()}
            </Button>
          </div>
        </div>
      ) : null}
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[8px] border-2 border-dashed border-line bg-paper-2 px-4 py-3 text-body-md text-ink-2 transition-colors hover:border-accent/40 hover:bg-accent-soft">
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
  );
}
