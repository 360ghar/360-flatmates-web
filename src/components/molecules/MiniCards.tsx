import type { HTMLAttributes } from "react";
import { MapPin } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { NetworkImage } from "../ui/NetworkImage";
import { PriceText } from "../ui/PriceText";
import { cn } from "../ui/component-utils";

export interface ProfileMiniCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
}

export function ProfileMiniCard({
  name,
  subtitle,
  avatarUrl,
  className,
  ...props
}: ProfileMiniCardProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <Avatar name={name} src={avatarUrl} />
      <div className="min-w-0">
        <p className="truncate text-body-md font-semibold text-ink">{name}</p>
        {subtitle ? <p className="truncate text-caption text-ink-3">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export interface ListingMiniCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  price: number;
  locality?: string;
  imageUrl?: string | null;
}

export function ListingMiniCard({
  title,
  price,
  locality,
  imageUrl,
  className,
  ...props
}: ListingMiniCardProps) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      <NetworkImage alt={title} src={imageUrl} wrapperClassName="h-12 w-12 shrink-0 rounded-xl" />
      <div className="min-w-0">
        <p className="truncate text-body-md font-semibold text-ink">{title}</p>
        <div className="mt-1 flex items-center gap-2">
          <PriceText value={price} variant="inline" />
          {locality ? (
            <span className="flex min-w-0 items-center gap-1 text-caption text-ink-3">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{locality}</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

