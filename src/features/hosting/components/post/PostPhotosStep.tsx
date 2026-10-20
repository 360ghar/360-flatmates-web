import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { Skeleton } from "@/components/ui/Skeleton";

/** Photos step of the wizard. Each photo is uploaded when picked; the form keeps its hosted URL. */
export function PostPhotosStep({
  imageUrls,
  uploadingCount,
  onFilesSelected,
  onRemovePhoto
}: {
  imageUrls: string[];
  uploadingCount: number;
  onFilesSelected: (files: File[]) => void;
  onRemovePhoto: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-h2 text-ink">Photos</h2>
      <p className="text-body-md text-ink-2">
        Add photos to make your listing stand out. You can add more after publishing.
      </p>

      <Button
        aria-label="Choose listing photos"
        variant="secondary"
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
          onFilesSelected(Array.from(e.currentTarget.files ?? []));
          e.currentTarget.value = "";
        }}
      />

      {imageUrls.length > 0 || uploadingCount > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {imageUrls.map((url, index) => (
            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-cut-md bg-surface-soft">
              <NetworkImage
                alt={`Listing photo ${index + 1}`}
                src={url}
                wrapperClassName="h-full w-full rounded-cut-md"
              />
              <button
                type="button"
                onClick={() => onRemovePhoto(url)}
                className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-scrim/70 text-white opacity-100 transition-opacity hover:bg-scrim/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                aria-label={`Remove photo ${index + 1}`}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-2 left-2 rounded-cut-sm bg-clay px-2 py-0.5 text-label-md text-on-clay">
                  Main
                </span>
              )}
            </div>
          ))}
          {Array.from({ length: uploadingCount }, (_, i) => (
            <Skeleton key={`uploading-${i}`} variant="block" className="aspect-[4/3] rounded-cut-md" />
          ))}
        </div>
      ) : (
        <p className="text-center text-body-md text-ink-3">No photos yet. You can add them after you publish, too.</p>
      )}
      {uploadingCount > 0 ? (
        <p className="text-body-sm text-ink-3" role="status">
          Uploading {uploadingCount} photo{uploadingCount > 1 ? "s" : ""}…
        </p>
      ) : null}
    </div>
  );
}
