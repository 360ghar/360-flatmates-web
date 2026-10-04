import type { HTMLAttributes } from "react";
import { MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { cn, focusRing } from "@/components/ui/component-utils";
import { formatCurrencyINR, formatLocation } from "@/lib/utils";

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

/**
 * A room on a paper card: photo, rent, place, one line of facts and the
 * owner. The title opens the listing (its hit area covers the card); the
 * button sits above it, so there is never a control inside a control.
 */
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
  const facts = [
    listing.beds !== undefined ? `${listing.beds} bed` : null,
    listing.baths !== undefined ? `${listing.baths} bath` : null,
    listing.areaSqFt !== undefined ? `${listing.areaSqFt} sq ft` : null
  ].filter(Boolean);
  const features = listing.features ?? [];
  const isHorizontal = layout === "horizontal";

  return (
    <article
      className={cn(
        "paper-grain group relative flex overflow-hidden rounded-hand bg-surface shadow-sm transition-[transform,box-shadow] duration-200 ease-[var(--ease-paper-out)]",
        onOpen && "paper-lift",
        isHorizontal ? "flex-col lg:grid lg:grid-cols-[220px_minmax(0,1fr)]" : "flex-col",
        className
      )}
      {...props}
    >
      <div className={cn("relative shrink-0 overflow-hidden bg-surface-soft", isHorizontal ? "aspect-[4/3] lg:aspect-auto lg:h-full" : "aspect-[4/3]")}>
        <NetworkImage alt="" src={listing.imageUrl} width={600} wrapperClassName="h-full w-full rounded-none" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <p className="flex items-baseline justify-between gap-3">
          <span className="text-h4 tabular-nums text-ink">
            {formatCurrencyINR(listing.price)}
            <span className="text-body-md font-normal text-ink-3"> a month</span>
          </span>
          {listing.compatibilityScore !== undefined ? (
            <span className="shrink-0 text-label-md tabular-nums text-pine">{Math.round(listing.compatibilityScore)}% match</span>
          ) : null}
        </p>
        <h3 className="line-clamp-1 text-body-lg font-semibold text-ink">
          {onOpen ? (
            <button
              type="button"
              onClick={() => onOpen(listing.id)}
              className={cn("text-left after:absolute after:inset-0 after:content-[''] hover:text-clay", focusRing, "focus-visible:outline-offset-4")}
            >
              {listing.title}
            </button>
          ) : (
            listing.title
          )}
        </h3>
        {location ? (
          <p className="flex items-center gap-1 text-body-md text-ink-2">
            <MapPin aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-3" />
            <span className="truncate">{location}</span>
          </p>
        ) : null}
        {facts.length > 0 ? <p className="text-body-md tabular-nums text-ink-2">{facts.join(" · ")}</p> : null}
        {features.length > 0 ? (
          <p className="line-clamp-1 text-caption text-ink-3">
            {features.slice(0, 3).join(", ")}
            {features.length > 3 ? `, +${features.length - 3} more` : ""}
          </p>
        ) : null}
        {listing.description ? <p className="line-clamp-2 text-caption text-ink-3">{listing.description}</p> : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {listing.owner ? (
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={listing.owner.name} size="compact" src={listing.owner.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate text-caption font-semibold text-ink-2">{listing.owner.name}</p>
                {listing.interestCount !== undefined ? (
                  <p className="flex items-center gap-1 text-caption text-ink-3">
                    <Users aria-hidden="true" className="h-3 w-3" />
                    {listing.interestCount} interested
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <span />
          )}
          {onContact || onOpen ? (
            <Button
              size="compact"
              variant="secondary"
              className="relative z-[1]"
              onClick={() => (onContact ? onContact(listing.id) : onOpen?.(listing.id))}
            >
              {ctaLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
