import type { Property } from "@/lib/api/types";
import type { ListingCardData } from "@/features/listings/components/ListingCard";

/** Map API property type to ListingCardData for the ListingCard component */
export function propertyToListingCardProps(property: Property): ListingCardData {
  return {
    id: String(property.id),
    title: property.title,
    price: property.monthly_rent,
    imageUrl: property.main_image_url,
    locality: property.locality,
    city: property.city,
    beds: property.bedrooms,
    baths: property.bathrooms,
    areaSqFt: property.area_sqft,
    features: property.features,
    owner: property.owner
      ? {
          name: property.owner.full_name,
          avatarUrl: property.owner.profile_image_url
        }
      : property.owner_name
        ? { name: property.owner_name }
        : undefined,
    interestCount: property.interest_count,
    description: property.description,
    compatibilityScore: property.compatibility_score ?? undefined
  };
}
