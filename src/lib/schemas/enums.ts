import { z } from "zod";
import {
  AGE_BUCKET_VALUES,
  ALERT_CHANNEL_VALUES,
  ALERT_FREQUENCY_VALUES,
  CLEANLINESS_VALUES,
  DRINKING_VALUES,
  FLATMATE_MODE_VALUES,
  FOOD_HABITS_VALUES,
  FURNISHING_LEVEL_VALUES,
  GENDER_PREFERENCE_VALUES,
  GUESTS_POLICY_VALUES,
  KITCHEN_TYPE_VALUES,
  LISTING_SHARING_TYPE_VALUES,
  MOVE_IN_TIMELINE_VALUES,
  NON_NEGOTIABLE_VALUES,
  PROFILE_STATUS_VALUES,
  PROPERTY_PURPOSE_VALUES,
  PROPERTY_TYPE_VALUES,
  SEARCH_SORT_VALUES,
  SEARCH_TYPE_VALUES,
  SLEEP_SCHEDULE_VALUES,
  SMOKING_VALUES,
  SOCIETY_TYPE_VALUES,
  VENTILATION_TYPE_VALUES,
  VISIT_CONTEXT_VALUES,
  VISIT_STATUS_VALUES,
  WORK_STYLE_VALUES
} from "@/lib/data";

export const flatmatesModeSchema = z.enum(FLATMATE_MODE_VALUES);
export const profileStatusSchema = z.enum(PROFILE_STATUS_VALUES);
/** Legacy move-in values stored before the timeline enum was expanded.
 *  Normalized on parse so stored profiles and persisted onboarding drafts
 *  survive the schema change instead of being silently dropped. */
const LEGACY_MOVE_IN_TIMELINE_MAP: Record<string, string> = {
  immediate: "immediately",
  this_month: "within_1_month",
  next_month: "within_2_months"
};

export const moveInTimelineSchema = z.preprocess(
  (value) =>
    typeof value === "string" && value in LEGACY_MOVE_IN_TIMELINE_MAP
      ? LEGACY_MOVE_IN_TIMELINE_MAP[value]
      : value,
  z.enum(MOVE_IN_TIMELINE_VALUES)
);
export const sleepScheduleSchema = z.enum(SLEEP_SCHEDULE_VALUES);
export const cleanlinessSchema = z.enum(CLEANLINESS_VALUES);
export const foodHabitsSchema = z.enum(FOOD_HABITS_VALUES);
export const smokingTypeSchema = z.enum(SMOKING_VALUES);
export const drinkingTypeSchema = z.enum(DRINKING_VALUES);
export const ageBucketSchema = z.enum(AGE_BUCKET_VALUES);
export const guestsPolicySchema = z.enum(GUESTS_POLICY_VALUES);
export const workStyleSchema = z.enum(WORK_STYLE_VALUES);
export const genderPreferenceSchema = z.enum(GENDER_PREFERENCE_VALUES);
export const nonNegotiableSchema = z.enum(NON_NEGOTIABLE_VALUES);
export const propertyTypeSchema = z.enum(PROPERTY_TYPE_VALUES);
export const propertyPurposeSchema = z.enum(PROPERTY_PURPOSE_VALUES);
export const listingSharingTypeSchema = z.enum(LISTING_SHARING_TYPE_VALUES);
export const kitchenTypeSchema = z.enum(KITCHEN_TYPE_VALUES);
export const ventilationTypeSchema = z.enum(VENTILATION_TYPE_VALUES);
export const furnishingLevelSchema = z.enum(FURNISHING_LEVEL_VALUES);
export const societyTypeSchema = z.enum(SOCIETY_TYPE_VALUES);
export const searchTypeSchema = z.enum(SEARCH_TYPE_VALUES);
export const searchSortSchema = z.enum(SEARCH_SORT_VALUES);
export const alertFrequencySchema = z.enum(ALERT_FREQUENCY_VALUES);
export const alertChannelSchema = z.enum(ALERT_CHANNEL_VALUES);
export const visitContextSchema = z.enum(VISIT_CONTEXT_VALUES);
export const visitStatusSchema = z.enum(VISIT_STATUS_VALUES);

export const jsonObjectSchema = z.record(z.string(), z.unknown());

