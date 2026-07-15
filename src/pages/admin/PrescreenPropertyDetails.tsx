import { Flag } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import { humanizeSnakeCase, formatSharingType } from "@/lib/utils";
import type { StatusTone } from "@/components/ui/Badge";
import type { Property } from "@/lib/api/types";
import { PrescreenDetailItem } from "./PrescreenDetailItem";

const PROPERTY_MOD_STATUS_BADGE: Record<string, StatusTone> = {
  approved: "confirmed",
  rejected: "rejected",
};

export function PrescreenPropertyDetails({ property }: { property: Property }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Images */}
      {property.image_urls && property.image_urls.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {property.image_urls.map((url, index) => (
            <NetworkImage
              key={url}
              src={url}
              alt={`${property.title} - image ${index + 1}`}
              wrapperClassName="aspect-[16/10] rounded-2xl"
            />
          ))}
        </div>
      )}
      {property.main_image_url && (!property.image_urls || property.image_urls.length === 0) && (
        <NetworkImage
          src={property.main_image_url}
          alt={property.title}
          wrapperClassName="aspect-[16/10] max-h-80 rounded-2xl"
        />
      )}

      {/* Title & Price */}
      <Card as="section" variant="compact">
        <h2 className="text-h2 text-ink">{property.title}</h2>
        <p className="mt-1 text-body-md text-ink-2">
          {property.locality}, {property.city}
          {property.state ? `, ${property.state}` : ""}
        </p>
        <div className="mt-3 flex items-center gap-4">
          <PriceText value={property.monthly_rent} variant="hero" />
          {property.security_deposit && (
            <span className="text-body-md text-ink-3">
              Deposit: <PriceText value={property.security_deposit} variant="inline" suffix="" />
            </span>
          )}
        </div>
        {property.sharing_type && (
          <Badge className="mt-3" tone="teal">
            {formatSharingType(property.sharing_type)}
          </Badge>
        )}
      </Card>

      {/* Description */}
      {property.description && (
        <Card as="section" variant="compact">
          <h3 className="text-eyebrow text-ink-3">Description</h3>
          <p className="mt-2 whitespace-pre-wrap text-body-md text-ink-2">
            {property.description}
          </p>
        </Card>
      )}

      {/* Property Details */}
      <Card as="section" variant="compact">
        <h3 className="text-eyebrow text-ink-3">Property Details</h3>
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
          {property.gender_preference && (
            <PrescreenDetailItem
              label="Gender preference"
              value={humanizeSnakeCase(property.gender_preference)}
            />
          )}
        </div>
      </Card>

      {/* Features & Amenities */}
      {property.features && property.features.length > 0 && (
        <Card as="section" variant="compact">
          <h3 className="text-eyebrow text-ink-3">Features</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {property.features.map((feature) => (
              <Badge key={feature} tone="neutral">
                {humanizeSnakeCase(feature)}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Owner Info */}
      {property.owner && (
        <Card as="section" variant="compact">
          <h3 className="text-eyebrow text-ink-3">Owner</h3>
          <div className="mt-3 flex items-center gap-3">
            <Avatar
              name={property.owner.full_name}
              src={property.owner.profile_image_url}
              size="sm"
              shape="circle"
            />
            <div>
              <p className="text-body-lg font-semibold text-ink">
                {property.owner.full_name}
              </p>
              {property.owner.phone && (
                <p className="text-caption text-ink-3">{property.owner.phone}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Moderation Status */}
      {property.property_status && (
        <Card as="section" variant="compact">
          <h3 className="text-eyebrow text-ink-3">Moderation Status</h3>
          <div className="mt-3">
            <Badge
              variant="status"
              status={PROPERTY_MOD_STATUS_BADGE[property.property_status ?? ""] ?? "pending"}
            />
          </div>
        </Card>
      )}

      {/* AI Pre-Screen Flags */}
      {property.tags && property.tags.length > 0 && (
        <Card as="section" variant="compact">
          <h3 className="text-eyebrow text-ink-3">AI Flags</h3>
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
