import { Share } from "lucide-react";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { cn, focusRing } from "@/components/ui/component-utils";

/** The listing's photos: one lead photo and up to two more beside it. */
export function ListingPhotoGallery({
  title,
  imageUrl,
  compatibilityScore,
  extraPhotos,
  onShareClick
}: {
  title: string;
  imageUrl?: string | null;
  compatibilityScore?: number;
  extraPhotos: string[];
  onShareClick: () => void;
}) {
  const hasGallery = extraPhotos.length > 0;

  return (
    <div className={hasGallery ? "grid gap-2 md:h-[440px] md:grid-cols-3 md:grid-rows-2" : ""}>
      <div
        className={cn(
          "relative overflow-hidden rounded-hand bg-surface-soft shadow-sm",
          hasGallery ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:h-full" : "aspect-[16/10] w-full"
        )}
      >
        <NetworkImage alt={title} src={imageUrl} wrapperClassName="h-full w-full rounded-none" />
        {compatibilityScore !== undefined ? (
          <span className="absolute left-3 top-3 rounded-cut-md bg-paper-3 px-3 py-1.5 text-label-lg tabular-nums text-ink shadow-xs">
            {Math.round(compatibilityScore)}% match
          </span>
        ) : null}
        <button
          type="button"
          onClick={onShareClick}
          aria-label="Share this listing"
          className={cn("absolute right-3 top-3 grid size-11 place-items-center rounded-cut-md bg-paper-3 text-ink shadow-xs hover:text-clay", focusRing)}
        >
          <Share className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {hasGallery
        ? extraPhotos.map((url, index) => (
            <div key={`${url}-${index}`} className="relative hidden min-h-0 overflow-hidden rounded-hand bg-surface-soft shadow-xs md:block md:h-full">
              <NetworkImage alt="" src={url} wrapperClassName="h-full w-full rounded-none" />
            </div>
          ))
        : null}
    </div>
  );
}
