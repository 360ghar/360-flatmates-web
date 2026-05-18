export type OptionValue<TOptions extends readonly { value: string }[]> =
  TOptions[number]["value"];

export interface DomainOption<TValue extends string = string> {
  value: TValue;
  label: string;
  description?: string;
}

export const FLATMATE_MODE_VALUES = [
  "room_poster",
  "co_hunter",
  "open_to_both"
] as const;

export type FlatmatesMode = (typeof FLATMATE_MODE_VALUES)[number];

export const FLATMATE_MODE_OPTIONS = [
  {
    value: "room_poster",
    label: "Room Poster",
    description: "Has a room and wants to find a compatible flatmate."
  },
  {
    value: "co_hunter",
    label: "Co-Hunter",
    description: "Looking for people to search for a home with."
  },
  {
    value: "open_to_both",
    label: "Open to Both",
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
  "immediate",
  "this_month",
  "next_month",
  "flexible"
] as const;

export type MoveInTimeline = (typeof MOVE_IN_TIMELINE_VALUES)[number];

export const MOVE_IN_TIMELINE_OPTIONS = [
  { value: "immediate", label: "Immediately" },
  { value: "this_month", label: "This month" },
  { value: "next_month", label: "Next month" },
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
  "non_vegetarian",
  "eggetarian",
  "no_preference"
] as const;

export type FoodHabits = (typeof FOOD_HABITS_VALUES)[number];

export const SMOKING_DRINKING_VALUES = [
  "neither",
  "smoke_outside",
  "no_preference"
] as const;

export type SmokingDrinking = (typeof SMOKING_DRINKING_VALUES)[number];

export const GUESTS_POLICY_VALUES = [
  "no_overnight",
  "occasional_ok",
  "open_house"
] as const;

export type GuestsPolicy = (typeof GUESTS_POLICY_VALUES)[number];

export const WORK_STYLE_VALUES = ["wfh_mostly", "office_mostly", "mixed"] as const;

export type WorkStyle = (typeof WORK_STYLE_VALUES)[number];

export const LIFESTYLE_DIMENSION_VALUES = [
  "sleep_schedule",
  "cleanliness",
  "food_habits",
  "smoking_drinking",
  "guests_policy",
  "work_style"
] as const;

export type LifestyleDimensionKey = (typeof LIFESTYLE_DIMENSION_VALUES)[number];

export const LIFESTYLE_DIMENSIONS = [
  {
    key: "sleep_schedule",
    label: "Sleep Schedule",
    weight: 0.2,
    options: [
      { value: "early_bird", label: "Early Bird" },
      { value: "flexible", label: "Flexible" },
      { value: "night_owl", label: "Night Owl" }
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
    label: "Food Habits",
    weight: 0.15,
    options: [
      { value: "vegetarian", label: "Vegetarian" },
      { value: "non_vegetarian", label: "Non-Vegetarian" },
      { value: "eggetarian", label: "Eggetarian" },
      { value: "no_preference", label: "No Preference" }
    ]
  },
  {
    key: "smoking_drinking",
    label: "Smoking/Drinking",
    weight: 0.2,
    options: [
      { value: "neither", label: "Neither" },
      { value: "smoke_outside", label: "Smoke Outside" },
      { value: "no_preference", label: "No Preference" }
    ]
  },
  {
    key: "guests_policy",
    label: "Guests Policy",
    weight: 0.15,
    options: [
      { value: "no_overnight", label: "No Overnight Guests" },
      { value: "occasional_ok", label: "Occasional Guests OK" },
      { value: "open_house", label: "Open House" }
    ]
  },
  {
    key: "work_style",
    label: "Work Style",
    weight: 0.1,
    options: [
      { value: "wfh_mostly", label: "WFH Mostly" },
      { value: "office_mostly", label: "Office Mostly" },
      { value: "mixed", label: "Mixed" }
    ]
  }
] as const;

export type LifestyleProfile = {
  sleep_schedule?: SleepSchedule;
  cleanliness?: Cleanliness;
  food_habits?: FoodHabits;
  smoking_drinking?: SmokingDrinking;
  guests_policy?: GuestsPolicy;
  work_style?: WorkStyle;
};

export const GENDER_PREFERENCE_VALUES = ["male", "female", "any"] as const;

export type GenderPreference = (typeof GENDER_PREFERENCE_VALUES)[number];

export const NON_NEGOTIABLE_VALUES = [
  "food_veg_only",
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
  { value: "food_veg_only", label: "Veg Only" },
  { value: "no_smoking", label: "No Smoking" },
  { value: "no_drinking", label: "No Drinking" },
  { value: "no_overnight_guests", label: "No Overnight Guests" },
  { value: "no_pets", label: "No Pets" },
  { value: "gender_female_only", label: "Female Flatmates Only" },
  { value: "gender_male_only", label: "Male Flatmates Only" },
  { value: "no_parties", label: "No Parties" },
  { value: "min_tidy", label: "Tidy Home" },
  { value: "early_riser", label: "Early Riser" }
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
  { value: "private_room", label: "Private Room" },
  { value: "shared_room", label: "Shared Room" },
  { value: "master_bedroom", label: "Master Bedroom" },
  { value: "entire_flat", label: "Entire Flat" }
] as const satisfies readonly DomainOption<ListingSharingType>[];

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

export const SWIPE_TARGET_TYPE_VALUES = ["property", "user"] as const;

export type SwipeTargetType = (typeof SWIPE_TARGET_TYPE_VALUES)[number];

export const SWIPE_ACTION_VALUES = ["pass", "like", "super_like"] as const;

export type SwipeAction = (typeof SWIPE_ACTION_VALUES)[number];

export const MESSAGE_TYPE_VALUES = [
  "text",
  "image",
  "system",
  "visit_request"
] as const;

export type MessageType = (typeof MESSAGE_TYPE_VALUES)[number];

export const POPULAR_CITIES = [
  "Gurugram",
  "Bangalore",
  // "Delhi NCR",
  // "Mumbai",
  // "Hyderabad",
  // "Pune",
  // "Noida",
] as const;

export const USER_REPORT_REASON_VALUES = [
  "spam",
  "fake_profile",
  "abuse",
  "inappropriate",
  "other"
] as const;

export type UserReportReason = (typeof USER_REPORT_REASON_VALUES)[number];

export const USER_REPORT_STATUS_VALUES = [
  "open",
  "reviewed",
  "dismissed",
  "actioned"
] as const;

export type UserReportStatus = (typeof USER_REPORT_STATUS_VALUES)[number];

export const BOOST_DURATION_VALUES = ["24h", "7d", "30d"] as const;

export type BoostDuration = (typeof BOOST_DURATION_VALUES)[number];

export const SHARE_CARD_FORMAT_VALUES = [
  "whatsapp_square",
  "instagram_story",
  "original"
] as const;

export type ShareCardFormat = (typeof SHARE_CARD_FORMAT_VALUES)[number];

export const DEVICE_PLATFORM_VALUES = ["ios", "android", "web"] as const;

export type DevicePlatform = (typeof DEVICE_PLATFORM_VALUES)[number];

export const USER_ROLE_VALUES = ["user", "admin", "agent"] as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export const USER_MATCH_STATUS_VALUES = ["active", "unmatched", "blocked"] as const;

export type UserMatchStatus = (typeof USER_MATCH_STATUS_VALUES)[number];

export const CONVERSATION_SOURCE_VALUES = ["listing_interest", "profile_match"] as const;

export type ConversationSource = (typeof CONVERSATION_SOURCE_VALUES)[number];

export const CONVERSATION_STATUS_VALUES = ["active", "archived", "blocked", "closed"] as const;

export type ConversationStatus = (typeof CONVERSATION_STATUS_VALUES)[number];

export const PROPERTY_LIFECYCLE_STATUS_VALUES = ["draft", "active", "paused", "expired"] as const;

export type PropertyLifecycleStatus = (typeof PROPERTY_LIFECYCLE_STATUS_VALUES)[number];

export const PROPERTY_MODERATION_STATUS_VALUES = ["pending_review", "approved", "rejected"] as const;

export type PropertyModerationStatus = (typeof PROPERTY_MODERATION_STATUS_VALUES)[number];

export const COMPATIBILITY_COLOR_VALUES = ["green", "amber", "red"] as const;

export type CompatibilityColor = (typeof COMPATIBILITY_COLOR_VALUES)[number];

export const INTEREST_LEVEL_VALUES = ["high", "medium", "low"] as const;

export type InterestLevel = (typeof INTEREST_LEVEL_VALUES)[number];

export const MODERATION_ACTION_VALUES = ["approve", "reject", "request_edit"] as const;

export type ModerationAction = (typeof MODERATION_ACTION_VALUES)[number];

export const REPORT_STATUS_VALUES = ["open", "under_review", "resolved", "dismissed"] as const;

export type ReportStatus = (typeof REPORT_STATUS_VALUES)[number];

export const REPORT_ACTION_VALUES = ["dismiss", "warn", "suspend"] as const;

export type ReportAction = (typeof REPORT_ACTION_VALUES)[number];

export const SOCIETY_TAG_VOTE_DIRECTION_VALUES = ["up", "down"] as const;

export type SocietyTagVoteDirection = (typeof SOCIETY_TAG_VOTE_DIRECTION_VALUES)[number];

