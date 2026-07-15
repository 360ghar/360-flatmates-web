import type { HTMLAttributes, ReactNode } from "react";
import { Bath, BedDouble, MapPin, Maximize2, Users } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
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

type MetaChipTone = "blue" | "teal" | "purple" | "green" | "orange";

const metaChipTones: Record<MetaChipTone, string> = {
  blue: "bg-blue-soft text-blue-ink",
  teal: "bg-teal-soft text-teal-ink",
  purple: "bg-purple-soft text-purple-ink",
  green: "bg-green-soft text-green-ink",
  orange: "bg-orange-soft text-orange-ink",
};

/** Colored meta chips — mobile discover_listing_card palette */
function MetaChip({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  tone: MetaChipTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-medium",
        metaChipTones[tone]
      )}
    >
      {icon}
      {label}
    </span>
  );
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
      variant="media"
      interactive={Boolean(onOpen)}
      className={cn(
        // media variant: p-0 + surface + shadow (no class fight with cn())
        "group hover:shadow-hover",
        isHorizontal
          ? "grid gap-0 lg:grid-cols-[200px_minmax(0,1fr)]"
          : "flex flex-col gap-0",
        className
      )}
      onClick={() => onOpen?.(listing.id)}
      {...props}
    >
      {/* Image — full-bleed top */}
      <div
        className={cn(
          isHorizontal
            ? "relative aspect-[4/3] overflow-hidden bg-surface-soft shrink-0 lg:aspect-auto lg:min-h-full lg:rounded-none"
            : "relative aspect-[20/19] w-full overflow-hidden bg-surface-soft shrink-0"
        )}
      >
        <NetworkImage
          alt={listing.title}
          src={listing.imageUrl}
          width={600}
          wrapperClassName="h-full w-full rounded-none"
          className="group-hover:scale-[1.03] transition-transform duration-500 ease-out"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />

        {listing.compatibilityScore !== undefined ? (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full border border-white/40 bg-surface/95 px-2 py-0.5 shadow-sm backdrop-blur-sm">
            <span className="text-[9px] font-sans uppercase tracking-wider text-ink-3">Score</span>
            <ProgressRing
              value={listing.compatibilityScore}
              size="sm"
              showValue={true}
              label="Compatibility score"
            />
          </div>
        ) : null}
      </div>

      {/* Meta band on surface */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-2 bg-surface",
          isHorizontal ? "p-3.5" : "p-3.5 pt-3"
        )}
      >
        <div className="min-w-0">
          <PriceText
            value={listing.price}
            variant="card"
            className="text-ink font-sans text-base font-semibold tabular-nums"
          />
          <h3 className="mt-0.5 line-clamp-1 text-body-md font-semibold text-ink">
            {listing.title}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-caption text-ink-3">
            <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-ink-4" />
            <span className="truncate">{location}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {listing.beds !== undefined ? (
            <MetaChip
              tone="blue"
              icon={<BedDouble aria-hidden="true" className="h-3 w-3" />}
              label={`${listing.beds} Bed`}
            />
          ) : null}
          {listing.baths !== undefined ? (
            <MetaChip
              tone="teal"
              icon={<Bath aria-hidden="true" className="h-3 w-3" />}
              label={`${listing.baths} Bath`}
            />
          ) : null}
          {listing.areaSqFt !== undefined ? (
            <MetaChip
              tone="purple"
              icon={<Maximize2 aria-hidden="true" className="h-3 w-3" />}
              label={`${listing.areaSqFt} sq ft`}
            />
          ) : null}
        </div>

        {listing.features && listing.features.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {listing.features.slice(0, 2).map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-line bg-surface-soft px-2 py-0.5 text-caption text-ink-2"
              >
                {feature}
              </span>
            ))}
            {extraFeatures > 0 ? (
              <span className="text-caption text-ink-3">+{extraFeatures} more</span>
            ) : null}
          </div>
        ) : null}

        {listing.description ? (
          <p className="line-clamp-2 text-caption leading-relaxed text-ink-3">
            {listing.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {listing.owner ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={listing.owner.name} size="compact" src={listing.owner.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-caption font-medium leading-tight text-ink-2">
                  {listing.owner.name}
                </p>
                {listing.interestCount !== undefined ? (
                  <p className="mt-0.5 flex items-center gap-1 text-caption text-ink-3">
                    <Users aria-hidden="true" className="h-3 w-3" />
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
            variant="primary"
            onClick={(event) => {
              if (onContact) {
                event.stopPropagation();
                onContact(listing.id);
              }
            }}
            className="shrink-0 rounded-full px-3"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
