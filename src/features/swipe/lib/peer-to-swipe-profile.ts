import type { FlatmatesPeer } from "@/lib/api/types";
import type { OwnProfile } from "@/lib/schemas/profile";
import { readEnum } from "@/lib/api/schema";
import { peerName } from "@/lib/api/peer-fields";
import { calculateCompatibility, type CompatibilityProfile } from "@/lib/compatibility";
import {
  CLEANLINESS_VALUES,
  DRINKING_VALUES,
  FOOD_HABITS_VALUES,
  GUESTS_POLICY_VALUES,
  SLEEP_SCHEDULE_VALUES,
  SMOKING_VALUES,
  WORK_STYLE_VALUES
} from "@/lib/data";
import { formatLocation, formatMoveInTimeline } from "@/lib/utils/format";
import type { SwipeProfile } from "@/features/swipe/lib/swipeDeck.types";

/** Lifestyle answers as the compatibility engine reads them. An unknown value reads as missing. */
function toCompatibilityProfile(
  source: OwnProfile | FlatmatesPeer | null | undefined,
  id?: number
): CompatibilityProfile {
  return {
    id: id ?? source?.id,
    sleep_schedule: readEnum(SLEEP_SCHEDULE_VALUES, source?.sleep_schedule) ?? undefined,
    cleanliness: readEnum(CLEANLINESS_VALUES, source?.cleanliness) ?? undefined,
    food_habits: readEnum(FOOD_HABITS_VALUES, source?.food_habits) ?? undefined,
    smoking: readEnum(SMOKING_VALUES, source?.smoking) ?? undefined,
    drinking: readEnum(DRINKING_VALUES, source?.drinking) ?? undefined,
    guests_policy: readEnum(GUESTS_POLICY_VALUES, source?.guests_policy) ?? undefined,
    work_style: readEnum(WORK_STYLE_VALUES, source?.work_style) ?? undefined
  };
}

/** A deck card from an API peer; scored against `me` when the server gives no score. */
export function peerToSwipeProfile(
  peer: FlatmatesPeer,
  me?: OwnProfile | null
): SwipeProfile {
  const compat =
    me != null
      ? calculateCompatibility(
          toCompatibilityProfile(me, me.id),
          toCompatibilityProfile(peer, peer.id)
        )
      : null;
  // Listing context is one object. It is null when the peer has no live listing.
  const listing = peer.listing ?? null;

  return {
    id: String(peer.id),
    name: peerName(peer),
    ageBucket: peer.age_bucket ?? undefined,
    photoUrl: peer.profile_image_url ?? listing?.main_image_url,
    mode: peer.mode ?? undefined,
    verified: false,
    location: formatLocation(peer.locality, peer.city) || undefined,
    matchScore: peer.match_percentage ?? compat?.overall_percentage ?? 0,
    topMatches: peer.top_matches,
    moveInLabel: peer.move_in_timeline
      ? formatMoveInTimeline(peer.move_in_timeline)
      : undefined,
    bio: peer.bio ?? undefined,
    profession: peer.profession ?? undefined,
    budgetMin: peer.budget_min ?? undefined,
    budgetMax: peer.budget_max ?? undefined,
    moveInTimeline: peer.move_in_timeline ?? undefined,
    sleepSchedule: peer.sleep_schedule ?? undefined,
    cleanliness: peer.cleanliness ?? undefined,
    foodHabits: peer.food_habits ?? undefined,
    smoking: peer.smoking ?? undefined,
    drinking: peer.drinking ?? undefined,
    guestsPolicy: peer.guests_policy ?? undefined,
    workStyle: peer.work_style ?? undefined,
    gender: peer.gender ?? undefined,
    genderPreference: peer.gender_preference ?? undefined,
    nonNegotiables: peer.non_negotiables,
    hasPets: peer.has_pets,
    partyHabit: peer.party_habit ?? undefined,
    compatibilityDimensions: compat?.dimensions,
    propertyTitle: listing?.title ?? undefined,
    imageUrls: listing?.image_urls,
    monthlyRent: listing?.monthly_rent,
    securityDeposit: listing?.security_deposit,
    maintenance: listing?.maintenance_charges,
    roomType: listing?.room_type,
    floor: listing?.floor_number != null ? String(listing.floor_number) : null,
    amenities: listing?.amenities,
    features: listing?.features,
    availableFrom: listing?.available_from,
    areaSqft: listing?.area_sqft,
    bedrooms: listing?.bedrooms,
    totalFloors: listing?.total_floors,
    videoTourUrl: listing?.video_tour_url
  };
}
