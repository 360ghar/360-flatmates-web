import type { OwnProfile } from "@/lib/schemas/profile";

/**
 * How complete a profile is, as the share of its onboarding answers that are
 * filled in (0 to 100). The server sends no onboarding step, so progress comes
 * from the profile itself. A completed onboarding is 100; until then the
 * answers alone stop at 99, so a card never says "done" and "complete your profile".
 */
export function profileCompletion(profile: OwnProfile): number {
  if (profile.onboarding_completed) return 100;
  const answers: unknown[] = [
    profile.mode,
    profile.city,
    profile.locality,
    profile.full_name,
    profile.age,
    profile.profession,
    profile.profile_image_url,
    profile.sleep_schedule,
    profile.cleanliness,
    profile.food_habits,
    profile.smoking,
    profile.drinking,
    profile.guests_policy,
    profile.work_style,
    profile.budget_min,
    profile.budget_max,
    profile.move_in_timeline,
    profile.gender_preference
  ];
  const filled = answers.filter((v) => v !== undefined && v !== null && v !== "").length;
  return Math.min(99, Math.round((filled / answers.length) * 100));
}
