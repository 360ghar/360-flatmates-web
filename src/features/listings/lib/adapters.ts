import type { Property } from "@/lib/api/types";
import type { ListingCardData } from "@/features/listings/components/ListingCard";

/** Map API property type to ListingCardData for the ListingCard component */
export function propertyToListingCardProps(property: Property): ListingCardData {
  return {
    id: String(property.id),
    title: property.title,
    price: property.monthly_rent ?? null,
    imageUrl: property.main_image_url,
    locality: property.locality,
    city: property.city,
    beds: property.bedrooms ?? undefined,
    baths: property.bathrooms ?? undefined,
    areaSqFt: property.area_sqft ?? undefined,
    features: property.features ?? undefined,
    // The owner's name only. A property carries no owner photo or phone.
    owner: property.owner_name ? { name: property.owner_name } : undefined,
    interestCount: property.interest_count,
    description: property.description ?? undefined,
    compatibilityScore: property.compatibility_score ?? undefined
  };
}
