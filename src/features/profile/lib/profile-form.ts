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
  guestsPolicySchema,
  workStyleSchema,
} from "@/lib/schemas/enums";
import type { FlatmatesProfileUpdate } from "@/lib/api/types";
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
  age: z.number().min(18, "Must be at least 18").max(100, "Must be 100 or younger").optional(),
  native_place: z
    .string()
    .max(NATIVE_PLACE_MAX_LENGTH, `Must be ${NATIVE_PLACE_MAX_LENGTH} characters or fewer`)
    .optional(),
  linkedin_url: linkedinUrlSchema,
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
  mode: flatmatesModeSchema.optional()
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

/** Form fields that `PATCH /flatmates/profile` accepts. Email and phone are not among them. */
const UPDATABLE_FIELDS = [
  "full_name",
  "bio",
  "profession",
  "age",
  "native_place",
  "linkedin_url",
  "city",
  "locality",
  "budget_min",
  "budget_max",
  "move_in_timeline",
  "sleep_schedule",
  "cleanliness",
  "food_habits",
  "smoking",
  "drinking",
  "guests_policy",
  "work_style",
  "gender",
  "gender_preference",
  "mode"
] as const satisfies readonly (keyof ProfileFormData & keyof FlatmatesProfileUpdate)[];

function isBlank(value: unknown): boolean {
  return value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));
}

/**
 * The PATCH body for a profile save: only the fields the user changed, and
 * `null` for a field the user emptied (null clears it on the server).
 * `dirty` is react-hook-form's `dirtyFields`.
 */
export function toProfileUpdate(
  data: ProfileFormData,
  dirty: Partial<Record<keyof ProfileFormData, unknown>>
): FlatmatesProfileUpdate {
  const body: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (dirty[key]) body[key] = isBlank(data[key]) ? null : data[key];
  }
  return body as FlatmatesProfileUpdate;
}
