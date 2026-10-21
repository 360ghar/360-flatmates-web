import { Flag } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import { humanizeSnakeCase, formatSharingType } from "@/lib/utils";
import type { ListingModerationStatus } from "@/lib/data";
import type { PropertyDetail } from "@/lib/api/types";
import { ownerListingStatus, propertyImageUrls, readListingPreferences } from "@/lib/api/property-fields";
import { formatLocation } from "@/lib/utils";
import { PrescreenDetailItem } from "./PrescreenDetailItem";

const MODERATION_STATUS: Record<ListingModerationStatus, { label: string; tone: "success" | "warning" | "neutral" | "error" }> = {
  live: { label: "Live", tone: "success" },
  pending_review: { label: "Pending review", tone: "warning" },
  paused: { label: "Paused", tone: "neutral" },
  rejected: { label: "Rejected", tone: "error" }
};

export function PrescreenPropertyDetails({ property }: { property: PropertyDetail }) {
  const imageUrls = propertyImageUrls(property);
  const preferences = readListingPreferences(property);
  const stored = ownerListingStatus(property);
  const moderation = stored ? MODERATION_STATUS[stored] : null;
  return (
    <div className="flex flex-col gap-6">
      {/* Images */}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {imageUrls.map((url, index) => (
            <NetworkImage
              key={url}
              src={url}
              alt={`${property.title} - image ${index + 1}`}
              wrapperClassName="aspect-[16/10] rounded-cut-lg"
            />
          ))}
        </div>
      )}

      {/* Title & Price */}
      <Card as="section" variant="compact">
        <h2 className="text-h2 text-ink">{property.title}</h2>
        <p className="mt-1 text-body-md text-ink-2">
          {[formatLocation(property.locality, property.city), property.state].filter(Boolean).join(", ")}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <PriceText value={property.monthly_rent} variant="hero" />
          {property.security_deposit && (
            <span className="text-body-md text-ink-3">
              Deposit: <PriceText value={property.security_deposit} variant="inline" suffix="" />
            </span>
          )}
        </div>
        {preferences.sharingType && (
          <Badge className="mt-3" tone="teal">
            {formatSharingType(preferences.sharingType)}
          </Badge>
        )}
      </Card>

      {/* Description */}
      {property.description && (
        <Card as="section" variant="compact">
          <h3 className="text-h3 text-ink">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-body-md text-ink-2">
            {property.description}
          </p>
        </Card>
      )}

      {/* Property Details */}
      <Card as="section" variant="compact">
        <h3 className="text-h3 text-ink">Property Details</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          {property.property_type && (
            <PrescreenDetailItem label="Type" value={humanizeSnakeCase(property.property_type)} />
          )}
          {property.purpose && (
            <PrescreenDetailItem label="Purpose" value={humanizeSnakeCase(property.purpose)} />
          )}
          {property.bedrooms && (
            <PrescreenDetailItem label="Bedrooms" value={String(property.bedrooms)} />
          )}
          {property.bathrooms && (
            <PrescreenDetailItem label="Bathrooms" value={String(property.bathrooms)} />
          )}
          {property.area_sqft && (
            <PrescreenDetailItem label="Area" value={`${property.area_sqft} sq ft`} />
          )}
          {property.available_from && (
            <PrescreenDetailItem
              label="Available from"
              value={new Date(property.available_from).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            />
          )}
          {preferences.genderPreference && (
            <PrescreenDetailItem
              label="Gender preference"
              value={humanizeSnakeCase(preferences.genderPreference)}
            />
          )}
        </div>
      </Card>

      {/* Features & Amenities */}
      {property.features && property.features.length > 0 && (
        <Card as="section" variant="compact">
          <h3 className="text-h3 text-ink">Features</h3>
          <p className="mt-2 text-body-md text-ink-2">{property.features.map(humanizeSnakeCase).join(", ")}</p>
        </Card>
      )}

      {/* Owner Info */}
      {property.owner_name && (
        <Card as="section" variant="compact">
          <h3 className="text-h3 text-ink">Owner</h3>
          <div className="mt-3 flex items-center gap-3">
            <Avatar name={property.owner_name} size="sm" shape="circle" />
            <div>
              <p className="text-body-lg font-semibold text-ink">
                {property.owner_name}
              </p>
              {/* An admin sees the owner's own number; everyone else gets the agent or company number. */}
              {property.owner_contact && (
                <p className="text-caption text-ink-3">{property.owner_contact}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Moderation Status: only a listing type that has one */}
      {moderation ? (
        <Card as="section" variant="compact">
          <h3 className="text-h3 text-ink">Moderation Status</h3>
          <div className="mt-3">
            <Badge tone={moderation.tone}>{moderation.label}</Badge>
          </div>
        </Card>
      ) : null}

      {/* AI Pre-Screen Flags */}
      {property.tags && property.tags.length > 0 && (
        <Card as="section" variant="compact">
          <h3 className="text-h3 text-ink">AI Flags</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {property.tags.map((tag) => (
              <Badge
                key={tag}
                tone="warning"
                icon={<Flag aria-hidden="true" className="h-3 w-3" />}
              >
                {humanizeSnakeCase(tag)}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* TODO: Audit trail — surface the listing's moderation history
          (who took which action and when) once the backend exposes an
          audit-log endpoint. A "History" tab can be added to this
          detail page that lists each row chronologically. */}
    </div>
  );
}
