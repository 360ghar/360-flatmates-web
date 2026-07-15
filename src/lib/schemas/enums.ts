import { z } from "zod";
import {
  ALERT_CHANNEL_VALUES,
  ALERT_FREQUENCY_VALUES,
  CLEANLINESS_VALUES,
  FLATMATE_MODE_VALUES,
  FOOD_HABITS_VALUES,
  GENDER_PREFERENCE_VALUES,
  GUESTS_POLICY_VALUES,
  LISTING_SHARING_TYPE_VALUES,
  MOVE_IN_TIMELINE_VALUES,
  NON_NEGOTIABLE_VALUES,
  PROFILE_STATUS_VALUES,
  PROPERTY_PURPOSE_VALUES,
  PROPERTY_TYPE_VALUES,
  SEARCH_SORT_VALUES,
  SEARCH_TYPE_VALUES,
  SLEEP_SCHEDULE_VALUES,
  SMOKING_DRINKING_VALUES,
  SOCIETY_TYPE_VALUES,
  VISIT_CONTEXT_VALUES,
  VISIT_STATUS_VALUES,
  WORK_STYLE_VALUES
} from "@/lib/data";

export const flatmatesModeSchema = z.enum(FLATMATE_MODE_VALUES);
export const profileStatusSchema = z.enum(PROFILE_STATUS_VALUES);
export const moveInTimelineSchema = z.enum(MOVE_IN_TIMELINE_VALUES);
export const sleepScheduleSchema = z.enum(SLEEP_SCHEDULE_VALUES);
export const cleanlinessSchema = z.enum(CLEANLINESS_VALUES);
export const foodHabitsSchema = z.enum(FOOD_HABITS_VALUES);
export const smokingDrinkingSchema = z.enum(SMOKING_DRINKING_VALUES);
export const guestsPolicySchema = z.enum(GUESTS_POLICY_VALUES);
export const workStyleSchema = z.enum(WORK_STYLE_VALUES);
export const genderPreferenceSchema = z.enum(GENDER_PREFERENCE_VALUES);
export const nonNegotiableSchema = z.enum(NON_NEGOTIABLE_VALUES);
export const propertyTypeSchema = z.enum(PROPERTY_TYPE_VALUES);
export const propertyPurposeSchema = z.enum(PROPERTY_PURPOSE_VALUES);
export const listingSharingTypeSchema = z.enum(LISTING_SHARING_TYPE_VALUES);
export const societyTypeSchema = z.enum(SOCIETY_TYPE_VALUES);
export const searchTypeSchema = z.enum(SEARCH_TYPE_VALUES);
export const searchSortSchema = z.enum(SEARCH_SORT_VALUES);
export const alertFrequencySchema = z.enum(ALERT_FREQUENCY_VALUES);
export const alertChannelSchema = z.enum(ALERT_CHANNEL_VALUES);
export const visitContextSchema = z.enum(VISIT_CONTEXT_VALUES);
export const visitStatusSchema = z.enum(VISIT_STATUS_VALUES);

export const jsonObjectSchema = z.record(z.string(), z.unknown());

