import type { HTMLAttributes } from "react";
import { Bath, BedDouble, MapPin, Maximize2, Users } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Chip } from "../ui/Chip";
import { NetworkImage } from "../ui/NetworkImage";
import { PriceText } from "../ui/PriceText";
import { ProgressRing } from "../ui/ProgressRing";
import { cn } from "../ui/component-utils";
import { formatLocation } from "@/lib/utils";

export interface ListingCardData {
  id: string;
  title: string;
  price: number;
  imageUrl?: string | null;
  locality: string;
  city?: string;
  beds?: number;
  baths?: number;
  areaSqFt?: number;
  features?: string[];
  owner?: {
    id?: number;
    name: string;
    avatarUrl?: string | null;
  };
  interestCount?: number;
  description?: string;
  compatibilityScore?: number;
}

export interface ListingCardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  listing: ListingCardData;
  ctaLabel?: string;
  onContact?: (listingId: string) => void;
  onOpen?: (listingId: string) => void;
  layout?: "vertical" | "horizontal";
}

export function ListingCard({
  listing,
  ctaLabel = "Contact",
  onContact,
  onOpen,
  layout = "vertical",
  className,
  ...props
}: ListingCardProps) {
  const location = formatLocation(listing.locality, listing.city);
  const extraFeatures = listing.features ? Math.max(0, listing.features.length - 2) : 0;

  const isHorizontal = layout === "horizontal";

  return (
    <Card
      as="article"
      interactive={Boolean(onOpen)}
      className={cn(
        isHorizontal
          ? "group grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)] border border-line bg-surface hover:shadow-md hover:border-accent/20 transition-all duration-300"
          : "group flex flex-col gap-4 p-4 border border-line bg-surface hover:shadow-md hover:border-accent/20 transition-all duration-300",
        className
      )}
      onClick={() => onOpen?.(listing.id)}
      {...props}
    >
      {/* Image section */}
      <div
        className={cn(
          isHorizontal
            ? "relative aspect-[16/10] overflow-hidden rounded-xl md:aspect-[0.9] bg-paper-2 shrink-0"
            : "relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-paper-2 shrink-0"
        )}
      >
        <NetworkImage
          alt={listing.title}
          src={listing.imageUrl}
          width={600}
          wrapperClassName="h-full w-full rounded-xl"
          className="group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Subtle bottom gradient for depth */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Compatibility ring */}
        {listing.compatibilityScore !== undefined ? (
          <div className="absolute bottom-2 right-2 rounded-full bg-surface/95 px-2 py-0.5 shadow-xs backdrop-blur-sm border border-line-low flex items-center gap-1.5">
            <span className="text-[9px] uppercase font-mono tracking-wider text-ink-3">Score</span>
            <ProgressRing value={listing.compatibilityScore} size="sm" showValue={true} label="Compatibility score" />
          </div>
        ) : null}
      </div>

      {/* Content section */}
      <div className="flex min-w-0 flex-col gap-2.5 flex-1">
        {/* Price + Title */}
        <div className="min-w-0">
          <PriceText value={listing.price} variant="card" className="text-ink font-serif font-normal text-lg" />
          <h3 className="mt-0.5 line-clamp-1 text-body-md font-sans font-semibold text-ink group-hover:text-accent transition-colors duration-300">
            {listing.title}
          </h3>
        </div>

        {/* Location */}
        <p className="flex items-center gap-1.5 text-body-md text-ink-2">
          <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
          <span className="truncate">{location}</span>
        </p>

        {/* Info pills: beds, baths, area */}
        <div className="flex flex-wrap gap-1.5">
          {listing.beds !== undefined ? (
            <Chip aria-label={`${listing.beds} beds`} variant="info" className="bg-paper-2/60 border-0">
              <BedDouble aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
              <span className="text-ink">{listing.beds} Bed</span>
            </Chip>
          ) : null}
          {listing.baths !== undefined ? (
            <Chip aria-label={`${listing.baths} baths`} variant="info" className="bg-paper-2/60 border-0">
              <Bath aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
              <span className="text-ink">{listing.baths} Bath</span>
            </Chip>
          ) : null}
          {listing.areaSqFt !== undefined ? (
            <Chip aria-label={`${listing.areaSqFt} square feet`} variant="info" className="bg-paper-2/60 border-0">
              <Maximize2 aria-hidden="true" className="h-3.5 w-3.5 text-ink-3" />
              <span className="text-ink">{listing.areaSqFt} sq ft</span>
            </Chip>
          ) : null}
        </div>

        {/* Feature chips: max 2 visible + "+N more" */}
        {listing.features && listing.features.length > 0 ? (
          <div className="flex items-center gap-1.5">
            {listing.features.slice(0, 2).map((feature) => (
              <Chip key={feature} variant="info" className="bg-paper/40 border-[0.5px] border-line">
                {feature}
              </Chip>
            ))}
            {extraFeatures > 0 && (
              <span className="text-label-md text-ink-3 font-normal">+{extraFeatures} more</span>
            )}
          </div>
        ) : null}

        {/* Description */}
        {listing.description ? (
          <p className="line-clamp-2 text-body-md text-ink-2 leading-relaxed mt-0.5">{listing.description}</p>
        ) : null}

        {/* Owner row + CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2 border-t border-line-low">
          {listing.owner ? (
            <div className="flex min-w-0 items-center gap-2">
              <div className="relative shrink-0">
                <Avatar name={listing.owner.name} size="compact" src={listing.owner.avatarUrl} />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border-2 border-surface" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-caption font-semibold text-ink leading-tight">{listing.owner.name}</p>
                {listing.interestCount !== undefined ? (
                  <p className="flex items-center gap-1 text-caption text-ink-3 mt-0.5">
                    <Users aria-hidden="true" className="h-3.5 w-3.5" />
                    <span>{listing.interestCount} interested</span>
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <span />
          )}
          <Button
            size="compact"
            onClick={(event) => {
              // Only intercept the click when a dedicated contact handler
              // exists. Otherwise fall through to the card-level onOpen
              // (e.g. navigate to detail) so the CTA is never a no-op.
              if (onContact) {
                event.stopPropagation();
                onContact(listing.id);
              } else {
                onOpen?.(listing.id);
              }
            }}
            className="group-hover:bg-accent group-hover:text-white transition-all duration-300 shrink-0"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}

