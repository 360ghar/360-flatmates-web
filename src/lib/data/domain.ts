export type OptionValue<TOptions extends readonly { value: string }[]> =
  TOptions[number]["value"];

export interface DomainOption<TValue extends string = string> {
  value: TValue;
  label: string;
  description?: string;
}

export const FLATMATE_MODE_VALUES = [
  "room_poster",
  "seeker",
  "co_hunter",
  "open_to_both"
] as const;

export type FlatmatesMode = (typeof FLATMATE_MODE_VALUES)[number];

export const FLATMATE_MODE_OPTIONS = [
  {
    value: "room_poster",
    label: "Room poster",
    description: "Has a room and wants to find a compatible flatmate."
  },
  {
    value: "seeker",
    label: "Room seeker",
    description: "Looking for a room in an existing flat."
  },
  {
    value: "co_hunter",
    label: "Co-hunter",
    description: "Looking for people to search for a home with."
  },
  {
    value: "open_to_both",
    label: "Open to both",
    description: "Flexible between posting a room and co-hunting."
  }
] as const satisfies readonly DomainOption<FlatmatesMode>[];

export const PROFILE_STATUS_VALUES = [
  "draft",
  "pending_review",
  "active",
  "paused",
  "rejected"
] as const;

export type FlatmatesProfileStatus = (typeof PROFILE_STATUS_VALUES)[number];

export const MOVE_IN_TIMELINE_VALUES = [
  "immediately",
  "within_1_week",
  "within_2_weeks",
  "within_1_month",
  "within_2_months",
  "within_3_months",
  "flexible"
] as const;

export type MoveInTimeline = (typeof MOVE_IN_TIMELINE_VALUES)[number];

export const MOVE_IN_TIMELINE_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "within_1_week", label: "Within 1 week" },
  { value: "within_2_weeks", label: "Within 2 weeks" },
  { value: "within_1_month", label: "Within 1 month" },
  { value: "within_2_months", label: "Within 2 months" },
  { value: "within_3_months", label: "Within 3 months" },
  { value: "flexible", label: "Flexible" }
] as const satisfies readonly DomainOption<MoveInTimeline>[];

export const SLEEP_SCHEDULE_VALUES = [
  "early_bird",
  "flexible",
  "night_owl"
] as const;

export type SleepSchedule = (typeof SLEEP_SCHEDULE_VALUES)[number];

export const CLEANLINESS_VALUES = ["minimal", "tidy", "spotless"] as const;

export type Cleanliness = (typeof CLEANLINESS_VALUES)[number];

export const FOOD_HABITS_VALUES = [
  "vegetarian",
  "vegan",
  "non_vegetarian",
  "eggetarian",
  "no_preference"
] as const;

export type FoodHabits = (typeof FOOD_HABITS_VALUES)[number];

export const SMOKING_VALUES = ["never", "occasionally", "regularly"] as const;

export type SmokingType = (typeof SMOKING_VALUES)[number];

export const DRINKING_VALUES = ["never", "occasionally", "regularly"] as const;

export type DrinkingType = (typeof DRINKING_VALUES)[number];

export const SMOKING_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" }
] as const satisfies readonly DomainOption<SmokingType>[];

export const DRINKING_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" }
] as const satisfies readonly DomainOption<DrinkingType>[];

export const AGE_BUCKET_VALUES = [
  "18-24",
  "25-30",
  "31-35",
  "36-40",
  "41-45",
  "46+"
] as const;

export type AgeBucket = (typeof AGE_BUCKET_VALUES)[number];

/** Max length for a profile's native place (home town / city). */
export const NATIVE_PLACE_MAX_LENGTH = 120;

/** Max length for a profile's LinkedIn URL. */
export const LINKEDIN_URL_MAX_LENGTH = 255;

export const GUESTS_POLICY_VALUES = [
  "no_overnight_guests",
  "occasional_ok",
  "open_house"
] as const;

export type GuestsPolicy = (typeof GUESTS_POLICY_VALUES)[number];

export const WORK_STYLE_VALUES = ["wfh", "office", "hybrid"] as const;

export type WorkStyle = (typeof WORK_STYLE_VALUES)[number];

export type LifestyleDimensionKey =
  | "sleep_schedule"
  | "cleanliness"
  | "food_habits"
  | "smoking"
  | "drinking"
  | "guests_policy"
  | "work_style";

export const LIFESTYLE_DIMENSIONS = [
  {
    key: "sleep_schedule",
    label: "Sleep schedule",
    weight: 0.2,
    options: [
      { value: "early_bird", label: "Early bird" },
      { value: "flexible", label: "Flexible" },
      { value: "night_owl", label: "Night owl" }
    ]
  },
  {
    key: "cleanliness",
    label: "Cleanliness",
    weight: 0.2,
    options: [
      { value: "minimal", label: "Minimal" },
      { value: "tidy", label: "Tidy" },
      { value: "spotless", label: "Spotless" }
    ]
  },
  {
    key: "food_habits",
    label: "Food habits",
    weight: 0.15,
    options: [
      { value: "vegetarian", label: "Vegetarian" },
      { value: "vegan", label: "Vegan" },
      { value: "non_vegetarian", label: "Non-vegetarian" },
      { value: "eggetarian", label: "Eggetarian" },
      { value: "no_preference", label: "No preference" }
    ]
  },
  {
    key: "smoking",
    label: "Smoking",
    weight: 0.1,
    options: [
      { value: "never", label: "Never" },
      { value: "occasionally", label: "Occasionally" },
      { value: "regularly", label: "Regularly" }
    ]
  },
  {
    key: "drinking",
    label: "Drinking",
    weight: 0.1,
    options: [
      { value: "never", label: "Never" },
      { value: "occasionally", label: "Occasionally" },
      { value: "regularly", label: "Regularly" }
    ]
  },
  {
    key: "guests_policy",
    label: "Guests policy",
    weight: 0.15,
    options: [
      { value: "no_overnight_guests", label: "No overnight guests" },
      { value: "occasional_ok", label: "Occasional guests OK" },
      { value: "open_house", label: "Open house" }
    ]
  },
  {
    key: "work_style",
    label: "Work style",
    weight: 0.1,
    options: [
      { value: "wfh", label: "Work from home" },
      { value: "office", label: "Office" },
      { value: "hybrid", label: "Hybrid" }
    ]
  }
] as const;

/** The ordered answers for one lifestyle question, as { value, label }. */
export function lifestyleOptions(key: LifestyleDimensionKey): ReadonlyArray<{ value: string; label: string }> {
  return LIFESTYLE_DIMENSIONS.find((d) => d.key === key)?.options ?? [];
}

export type LifestyleProfile = {
  sleep_schedule?: SleepSchedule;
  cleanliness?: Cleanliness;
  food_habits?: FoodHabits;
  smoking?: SmokingType;
  drinking?: DrinkingType;
  guests_policy?: GuestsPolicy;
  work_style?: WorkStyle;
};

export const GENDER_PREFERENCE_VALUES = ["male", "female", "any"] as const;

export type GenderPreference = (typeof GENDER_PREFERENCE_VALUES)[number];

export const NON_NEGOTIABLE_VALUES = [
  "food_veg_only",
  "food_vegan_only",
  "no_smoking",
  "no_drinking",
  "no_overnight_guests",
  "no_pets",
  "gender_female_only",
  "gender_male_only",
  "no_parties",
  "min_tidy",
  "early_riser"
] as const;

export type NonNegotiable = (typeof NON_NEGOTIABLE_VALUES)[number];

export const NON_NEGOTIABLE_OPTIONS = [
  { value: "food_veg_only", label: "Veg only" },
  { value: "food_vegan_only", label: "Vegan only" },
  { value: "no_smoking", label: "No smoking" },
  { value: "no_drinking", label: "No drinking" },
  { value: "no_overnight_guests", label: "No overnight guests" },
  { value: "no_pets", label: "No pets" },
  { value: "gender_female_only", label: "Female flatmates only" },
  { value: "gender_male_only", label: "Male flatmates only" },
  { value: "no_parties", label: "No parties" },
  { value: "min_tidy", label: "Tidy home" },
  { value: "early_riser", label: "Early riser" }
] as const satisfies readonly DomainOption<NonNegotiable>[];

export const PROPERTY_TYPE_VALUES = ["pg", "flatmate"] as const;

export type PropertyType = (typeof PROPERTY_TYPE_VALUES)[number];

export const PROPERTY_PURPOSE_VALUES = ["rent"] as const;

export type PropertyPurpose = (typeof PROPERTY_PURPOSE_VALUES)[number];

export const LISTING_SHARING_TYPE_VALUES = [
  "private_room",
  "shared_room",
  "master_bedroom",
  "entire_flat"
] as const;

export type ListingSharingType = (typeof LISTING_SHARING_TYPE_VALUES)[number];

export const LISTING_SHARING_TYPE_OPTIONS = [
  { value: "private_room", label: "Private room" },
  { value: "shared_room", label: "Shared room" },
  { value: "master_bedroom", label: "Master bedroom" },
  { value: "entire_flat", label: "Entire flat" }
] as const satisfies readonly DomainOption<ListingSharingType>[];

export const KITCHEN_TYPE_VALUES = [
  "vegetarian",
  "non_vegetarian",
  "eggetarian",
  "any"
] as const;

export type KitchenType = (typeof KITCHEN_TYPE_VALUES)[number];

export const KITCHEN_TYPE_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non_vegetarian", label: "Non-vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "any", label: "Any" }
] as const satisfies readonly DomainOption<KitchenType>[];

export const VENTILATION_TYPE_VALUES = ["good", "average", "poor"] as const;

export type VentilationType = (typeof VENTILATION_TYPE_VALUES)[number];

export const VENTILATION_TYPE_OPTIONS = [
  { value: "good", label: "Good" },
  { value: "average", label: "Average" },
  { value: "poor", label: "Poor" }
] as const satisfies readonly DomainOption<VentilationType>[];

export const FURNISHING_LEVEL_VALUES = [
  "furnished",
  "semi_furnished",
  "unfurnished"
] as const;

export type FurnishingLevel = (typeof FURNISHING_LEVEL_VALUES)[number];

export const FURNISHING_LEVEL_OPTIONS = [
  { value: "furnished", label: "Furnished" },
  { value: "semi_furnished", label: "Semi-furnished" },
  { value: "unfurnished", label: "Unfurnished" }
] as const satisfies readonly DomainOption<FurnishingLevel>[];

export const SOCIETY_TYPE_VALUES = [
  "gated",
  "independent",
  "co_living",
  "pg"
] as const;

export type SocietyType = (typeof SOCIETY_TYPE_VALUES)[number];

export const SEARCH_TYPE_VALUES = ["listings", "profiles", "all"] as const;

export type SearchType = (typeof SEARCH_TYPE_VALUES)[number];

export const SEARCH_SORT_VALUES = [
  "distance",
  "price_low",
  "price_high",
  "newest",
  "popular",
  "relevance",
  "match_percentage"
] as const;

export type SearchSort = (typeof SEARCH_SORT_VALUES)[number];

export const ALERT_FREQUENCY_VALUES = ["instant", "daily", "weekly"] as const;

export type AlertFrequency = (typeof ALERT_FREQUENCY_VALUES)[number];

export const ALERT_CHANNEL_VALUES = ["email", "push", "in_app"] as const;

export type AlertChannel = (typeof ALERT_CHANNEL_VALUES)[number];

export const VISIT_CONTEXT_VALUES = ["property_tour", "flatmate_meet"] as const;

export type VisitContext = (typeof VISIT_CONTEXT_VALUES)[number];

export const VISIT_STATUS_VALUES = [
  "requested",
  "confirmed",
  "reschedule_suggested",
  "cancelled",
  "completed"
] as const;

export type VisitStatus = (typeof VISIT_STATUS_VALUES)[number];

export type SwipeTargetType = "property" | "user";

export type SwipeAction = "pass" | "like" | "super_like";

export type MessageType = "text" | "image" | "system" | "visit_request";

export const POPULAR_CITIES = [
  "Gurugram",
  "Bangalore",
  // "Delhi NCR",
  // "Mumbai",
  // "Hyderabad",
  // "Pune",
  // "Noida",
] as const;

export type UserReportReason = "spam" | "fake_profile" | "abuse" | "inappropriate" | "other";

export type UserReportStatus = "open" | "reviewed" | "dismissed" | "actioned";

export type BoostDuration = "24h" | "7d" | "30d";

export type ShareCardFormat = "whatsapp_square" | "instagram_story" | "original";

export type DevicePlatform = "ios" | "android" | "web";

export type UserRole = "user" | "admin" | "agent";

export type UserMatchStatus = "active" | "unmatched" | "blocked";

export type ConversationSource = "listing_interest" | "profile_match";

export type ConversationStatus = "active" | "archived" | "blocked" | "closed";

export type PropertyLifecycleStatus = "draft" | "active" | "paused" | "expired";

export const PROPERTY_MODERATION_STATUS_VALUES = ["pending_review", "approved", "rejected"] as const;

export type PropertyModerationStatus = (typeof PROPERTY_MODERATION_STATUS_VALUES)[number];

export type CompatibilityColor = "green" | "amber" | "red";

export type InterestLevel = "high" | "medium" | "low";

export type ModerationAction = "approve" | "reject" | "request_edit";

export const REPORT_STATUS_VALUES = ["open", "under_review", "resolved", "dismissed"] as const;

export type ReportStatus = (typeof REPORT_STATUS_VALUES)[number];

export type ReportAction = "dismiss" | "warn" | "suspend";

export type SocietyTagVoteDirection = "up" | "down";

