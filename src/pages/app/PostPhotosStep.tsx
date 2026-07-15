import type { RefObject } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PendingImage } from "./postListingUtils";

export function PostPhotosStep({
  pendingImages,
  fileInputRef,
  onFilesSelected,
  onRetryImage,
  onRemoveImage
}: {
  pendingImages: PendingImage[];
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFilesSelected: (files: FileList | null) => void;
  onRetryImage: (id: string) => void;
  onRemoveImage: (id: string) => void;
}) {
  return (
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
          onFilesSelected(files);
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
                  onClick={() => onRetryImage(img.id)}
                  className="absolute bottom-2 right-2 min-h-9 rounded-[8px] bg-surface px-3 py-1.5 text-caption font-semibold text-accent shadow-sm hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Retry
                </button>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
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
  );
}
