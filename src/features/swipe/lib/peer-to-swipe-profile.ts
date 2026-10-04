import type { FlatmatesPeer, FlatmatesProfile } from "@/lib/api/types";
import { calculateCompatibility, type CompatibilityProfile } from "@/lib/compatibility";
import { formatLocation, formatMoveInTimeline } from "@/lib/utils/format";
import type { SwipeProfile } from "@/features/swipe/lib/swipeDeck.types";

function toCompatibilityProfile(
  source: FlatmatesProfile | FlatmatesPeer | null | undefined,
  id?: number
): CompatibilityProfile {
  return {
    id: id ?? source?.id,
    sleep_schedule: source?.sleep_schedule,
    cleanliness: source?.cleanliness,
    food_habits: source?.food_habits,
    smoking: source?.smoking,
    drinking: source?.drinking,
    guests_policy: source?.guests_policy,
    work_style: source?.work_style
  };
}

/** A deck card from an API peer; scored against `me` when the server gives no score. */
export function peerToSwipeProfile(
  peer: FlatmatesPeer,
  me?: FlatmatesProfile | null
): SwipeProfile {
  const compat =
    me != null
      ? calculateCompatibility(
          toCompatibilityProfile(me, me.id),
          toCompatibilityProfile(peer, peer.id)
        )
      : null;

  return {
    id: String(peer.id),
    name: peer.full_name,
    age: peer.age,
    ageBucket: peer.age_bucket,
    photoUrl: peer.profile_image_url ?? peer.main_image_url,
    mode: peer.mode,
    verified: false,
    location: formatLocation(peer.locality, peer.city) || undefined,
    matchScore: peer.match_percentage ?? compat?.overall_percentage ?? 0,
    topMatches: peer.top_matches ?? [],
    moveInLabel: peer.move_in_timeline
      ? formatMoveInTimeline(peer.move_in_timeline)
      : undefined,
    bio: peer.bio,
    profession: peer.profession,
    budgetMin: peer.budget_min,
    budgetMax: peer.budget_max,
    moveInTimeline: peer.move_in_timeline,
    sleepSchedule: peer.sleep_schedule,
    cleanliness: peer.cleanliness,
    foodHabits: peer.food_habits,
    smoking: peer.smoking,
    drinking: peer.drinking,
    guestsPolicy: peer.guests_policy,
    workStyle: peer.work_style,
    gender: peer.gender,
    genderPreference: peer.gender_preference,
    nonNegotiables: peer.non_negotiables,
    hasPets: peer.has_pets,
    partyHabit: peer.party_habit,
    compatibilityDimensions: compat?.dimensions,
    propertyTitle: peer.property_title,
    imageUrls: peer.image_urls,
    monthlyRent: peer.monthly_rent,
    securityDeposit: peer.security_deposit,
    maintenance: peer.maintenance ?? peer.maintenance_charges,
    roomType: peer.room_type,
    flatConfig: peer.flat_config,
    floor: peer.floor ?? (peer.floor_number != null ? String(peer.floor_number) : null),
    societyName: peer.society_name,
    flatAmenities: peer.flat_amenities,
    societyAmenities: peer.society_amenities,
    amenities: peer.amenities,
    features: peer.features,
    furnishing: peer.furnishing,
    availableFrom: peer.available_from,
    areaSqft: peer.area_sqft,
    bedrooms: peer.bedrooms,
    totalFloors: peer.total_floors,
    videoTourUrl: peer.video_tour_url
  };
}
