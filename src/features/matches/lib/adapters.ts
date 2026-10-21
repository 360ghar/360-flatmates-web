import { peerName } from "@/lib/api/peer-fields";
import type { FlatmatesPeer } from "@/lib/api/types";
import type { ProfileGridCardData } from "@/features/matches/components/ProfileGridCard";
import { formatLocation } from "@/lib/utils";

/**
 * Map API peer profile to ProfileGridCardData for the ProfileGridCard component.
 * A peer has an age bucket, never an exact age. A missing score is 0, which the
 * card does not show.
 */
export function profileToProfileGridCardProps(profile: FlatmatesPeer): ProfileGridCardData {
  const location = formatLocation(profile.locality, profile.city);

  return {
    id: String(profile.id),
    name: peerName(profile),
    ageBucket: profile.age_bucket ?? undefined,
    location: location || undefined,
    profession: profile.profession ?? undefined,
    photoUrl: profile.profile_image_url,
    matchScore: profile.match_percentage ?? 0
  };
}
