import { z } from "zod";
import {
  flatmatesModeSchema,
  genderPreferenceSchema,
  moveInTimelineSchema,
  sleepScheduleSchema,
  cleanlinessSchema,
  foodHabitsSchema,
  smokingTypeSchema,
  drinkingTypeSchema,
  ageBucketSchema,
  guestsPolicySchema,
  workStyleSchema,
} from "@/lib/schemas/enums";
import { NATIVE_PLACE_MAX_LENGTH, LINKEDIN_URL_MAX_LENGTH } from "@/lib/data";

/** Profile edit form (ProfileEditPage and its sections). */
const linkedinUrlSchema = z
  .url("Enter a valid URL")
  .max(LINKEDIN_URL_MAX_LENGTH, `Must be ${LINKEDIN_URL_MAX_LENGTH} characters or fewer`)
  .optional()
  .or(z.literal(""));

export const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(100),
  bio: z.string().max(500, "Bio must be 500 characters or fewer").optional(),
  profession: z.string().max(80).optional(),
  age: z.number().min(18, "Must be at least 18").max(120).optional(),
  native_place: z
    .string()
    .max(NATIVE_PLACE_MAX_LENGTH, `Must be ${NATIVE_PLACE_MAX_LENGTH} characters or fewer`)
    .optional(),
  linkedin_url: linkedinUrlSchema,
  age_bucket: ageBucketSchema.optional(),
  city: z.string().max(60).optional(),
  locality: z.string().max(80).optional(),
  budget_min: z.number().min(0, "Cannot be negative").optional(),
  budget_max: z.number().min(0, "Cannot be negative").optional(),
  move_in_timeline: moveInTimelineSchema.optional(),
  sleep_schedule: sleepScheduleSchema.optional(),
  cleanliness: cleanlinessSchema.optional(),
  food_habits: foodHabitsSchema.optional(),
  smoking: smokingTypeSchema.optional(),
  drinking: drinkingTypeSchema.optional(),
  guests_policy: guestsPolicySchema.optional(),
  work_style: workStyleSchema.optional(),
  gender: z.string().optional(),
  gender_preference: genderPreferenceSchema.optional(),
  mode: flatmatesModeSchema.optional(),
  email: z.email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal(""))
}).refine(
  (data) =>
    data.budget_min === undefined ||
    data.budget_max === undefined ||
    Number.isNaN(data.budget_min) ||
    Number.isNaN(data.budget_max) ||
    data.budget_max >= data.budget_min,
  {
    message: "Maximum budget must be greater than or equal to minimum",
    path: ["budget_max"]
  }
);

export type ProfileFormData = z.infer<typeof profileSchema>;
