import type { RefObject } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PendingImage } from "@/features/hosting/lib/postListingUtils";

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
    <div className="flex flex-col gap-5">
      <h2 className="text-h2 text-ink">Photos</h2>
      <p className="text-body-md text-ink-2">
        Add photos to make your listing stand out. You can add more after publishing.
      </p>

      {/* Upload zone */}
      <Button
        aria-label="Choose listing photos"
        variant="secondary"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-cut-lg border-2 border-dashed border-line bg-surface-soft text-ink-3 hover:border-accent/50 hover:bg-accent-soft"
      >
        <ImagePlus aria-hidden="true" className="h-6 w-6" />
        <span className="text-body-md font-semibold text-ink">Add photos</span>
        <span className="text-caption text-ink-3">JPG or PNG. The first one is the main photo.</span>
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
              className="group relative aspect-[4/3] overflow-hidden rounded-cut-md bg-surface-soft"
            >
              {img.preview ? (
                <NetworkImage
                  alt={`Listing photo ${index + 1} preview`}
                  src={img.preview}
                  wrapperClassName="h-full w-full rounded-cut-md"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-error-soft px-2 text-center">
                  <span className="text-caption text-error">Could not load</span>
                </div>
              )}
              {/* Uploading overlay */}
              {img.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-scrim/40">
                  <Skeleton variant="block" className="h-4 w-16 rounded" />
                </div>
              )}
              {/* Retry control for a photo that failed to process */}
              {!img.uploading && !img.preview && (
                <button
                  type="button"
                  onClick={() => onRetryImage(img.id)}
                  className="absolute bottom-2 right-2 min-h-11 rounded-cut-md bg-surface px-3 text-label-md text-accent shadow-sm hover:bg-paper-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Retry
                </button>
              )}
              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-scrim/70 text-white opacity-100 transition-opacity hover:bg-scrim/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
              {/* Main badge */}
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-cut-sm bg-clay px-2 py-0.5 text-label-md text-on-clay">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {pendingImages.length === 0 && (
        <p className="text-center text-body-md text-ink-3">No photos yet. You can add them after you publish, too.</p>
      )}
    </div>
  );
}
