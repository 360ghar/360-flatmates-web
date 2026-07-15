import { Share } from "lucide-react";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { cn } from "@/components/ui/component-utils";

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
    <div className={hasGallery ? "grid gap-2 md:grid-cols-3 md:grid-rows-2 md:h-[420px]" : ""}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-line bg-surface-soft shadow-md",
          hasGallery
            ? "aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:h-full"
            : "aspect-[16/10] w-full"
        )}
      >
        <NetworkImage
          alt={title}
          src={imageUrl}
          wrapperClassName="h-full w-full rounded-2xl"
          className="hover:scale-[1.02] transition-transform duration-700 ease-out"
        />
        {compatibilityScore !== undefined && (
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/50 bg-surface/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2">Match</span>
            <ProgressRing value={compatibilityScore} size="sm" showValue label="Compatibility score" />
          </div>
        )}
        <button
          type="button"
          onClick={onShareClick}
          className="absolute top-4 right-4 rounded-full border border-white/50 bg-surface/95 p-2.5 text-ink shadow-md backdrop-blur-sm hover:text-accent"
          aria-label="Share this listing"
        >
          <Share className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {hasGallery
        ? extraPhotos.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative hidden min-h-0 overflow-hidden rounded-2xl border border-line bg-surface-soft shadow-sm md:block md:h-full"
            >
              <NetworkImage
                alt=""
                src={url}
                wrapperClassName="h-full w-full rounded-2xl"
                className="hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))
        : null}
    </div>
  );
}
