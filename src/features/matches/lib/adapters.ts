import type { FlatmatesPeer } from "@/lib/api/types";
import type { ProfileGridCardData } from "@/features/matches/components/ProfileGridCard";
import { formatLocation } from "@/lib/utils";

/** Map API peer profile to ProfileGridCardData for the ProfileGridCard component */
export function profileToProfileGridCardProps(profile: FlatmatesPeer): ProfileGridCardData {
  const location = formatLocation(profile.locality, profile.city);

  return {
    id: String(profile.id),
    name: profile.full_name,
    age: profile.age,
    ageBucket: profile.age_bucket,
    location: location || undefined,
    profession: profile.profession,
    photoUrl: profile.profile_image_url,
    matchScore: profile.match_percentage ?? 0
  };
}
