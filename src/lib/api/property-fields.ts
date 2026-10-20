import {
  GENDER_PREFERENCE_VALUES,
  LISTING_MODERATION_STATUS_VALUES,
  LISTING_SHARING_TYPE_VALUES,
  SOCIETY_TYPE_VALUES,
  type GenderPreference,
  type ListingModerationStatus,
  type ListingSharingType,
  type SocietyType
} from "@/lib/data";
import type { Property } from "./property.types";
import { readEnum } from "./schema";

/** Largest money value the backend takes (`PropertyCreate`, `PropertyUpdate`, the price filters). */
export const MONEY_MAX = 9_999_999_999.99;
/** Largest `area_sqft` the backend takes. */
export const AREA_MAX = 1_000_000;
/** Largest `floor_number` and `total_floors` the backend takes. */
export const FLOOR_MAX = 200;

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export interface ReadListingPreferences {
  sharingType: ListingSharingType | null;
  genderPreference: GenderPreference | null;
  societyType: SocietyType | null;
  societyAmenities: string[];
  societyVibeTags: string[];
  moderationStatus: ListingModerationStatus | null;
  expiresAt: string | null;
}

/**
 * Flatmate listing facts live in `Property.listing_preferences`, not at the top
 * level of the property. An unknown enum value reads as null.
 */
export function readListingPreferences(
  property: Pick<Property, "listing_preferences">
): ReadListingPreferences {
  const prefs = property.listing_preferences ?? {};
  return {
    sharingType: readEnum(LISTING_SHARING_TYPE_VALUES, prefs.sharing_type),
    genderPreference: readEnum(GENDER_PREFERENCE_VALUES, prefs.gender_preference),
    societyType: readEnum(SOCIETY_TYPE_VALUES, prefs.society_type),
    societyAmenities: stringList(prefs.society_amenities),
    societyVibeTags: stringList(prefs.society_vibe_tags),
    moderationStatus: readEnum(LISTING_MODERATION_STATUS_VALUES, prefs.moderation_status),
    expiresAt: typeof prefs.expires_at === "string" ? prefs.expires_at : null
  };
}

/**
 * Where a listing stands for its owner. The backend stores the state in
 * `listing_preferences.moderation_status`. A flatmate or PG listing with no
 * stored value counts as `pending_review`, the same as the moderation queue.
 * Any other listing type has no moderation state: `null`.
 */
export function ownerListingStatus(
  property: Pick<Property, "listing_preferences" | "property_type">
): ListingModerationStatus | null {
  const stored = readListingPreferences(property).moderationStatus;
  if (stored) return stored;
  return property.property_type === "flatmate" || property.property_type === "pg" ? "pending_review" : null;
}

/** Photo URLs of a listing in display order: `images[].image_url`. */
export function propertyImageUrls(
  property: Pick<Property, "images" | "main_image_url">
): string[] {
  const urls = [...(property.images ?? [])]
    .sort((a, b) => Number(b.is_main_image) - Number(a.is_main_image) || a.display_order - b.display_order)
    .map((image) => image.image_url);
  if (urls.length === 0 && property.main_image_url) return [property.main_image_url];
  return urls;
}
