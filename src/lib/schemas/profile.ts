import { z } from "zod";
import {
  cleanlinessSchema,
  flatmatesModeSchema,
  foodHabitsSchema,
  genderPreferenceSchema,
  guestsPolicySchema,
  jsonObjectSchema,
  moveInTimelineSchema,
  nonNegotiableSchema,
  profileStatusSchema,
  sleepScheduleSchema,
  smokingDrinkingSchema,
  workStyleSchema
} from "./enums";
import { minMaxRefine, optionalUrlSchema } from "./common";

export const lifestyleSchema = z.object({
  sleep_schedule: sleepScheduleSchema,
  cleanliness: cleanlinessSchema,
  food_habits: foodHabitsSchema,
  smoking_drinking: smokingDrinkingSchema,
  guests_policy: guestsPolicySchema,
  work_style: workStyleSchema
});

export const partialLifestyleSchema = lifestyleSchema.partial();

export const flatmatesProfileSchema = z.object({
  id: z.number().int().positive().catch(0),
  full_name: z.string().min(1).max(120).catch(""),
  email: z.string().email().optional().catch(undefined),
  phone: z.string().optional().catch(undefined),
  profile_image_url: optionalUrlSchema,
  mode: flatmatesModeSchema.catch("seeker"),
  profile_status: profileStatusSchema.optional().catch(undefined),
  onboarding_completed: z.boolean().catch(false),
  onboarding_current_step: z.number().int().min(0).max(7).optional().catch(undefined),
  bio: z.string().max(500).optional().catch(undefined),
  age: z.number().int().min(18).max(100).optional().catch(undefined),
  profession: z.string().max(120).optional().catch(undefined),
  budget_min: z.number().min(0).optional().catch(undefined),
  budget_max: z.number().min(0).optional().catch(undefined),
  move_in_timeline: moveInTimelineSchema.optional().catch(undefined),
  city: z.string().min(1).optional().catch(undefined),
  locality: z.string().min(1).optional().catch(undefined),
  sleep_schedule: sleepScheduleSchema.optional().catch(undefined),
  cleanliness: cleanlinessSchema.optional().catch(undefined),
  food_habits: foodHabitsSchema.optional().catch(undefined),
  smoking_drinking: smokingDrinkingSchema.optional().catch(undefined),
  guests_policy: guestsPolicySchema.optional().catch(undefined),
  work_style: workStyleSchema.optional().catch(undefined),
  gender: z.string().optional().catch(undefined),
  gender_preference: genderPreferenceSchema.optional().catch(undefined),
  preferences: jsonObjectSchema.optional().catch(undefined),
  last_active_at: z.string().optional().catch(undefined)
});

const budgetRefine = minMaxRefine("budget_min", "budget_max", "Minimum budget cannot exceed maximum budget");

export const flatmatesProfileUpdateSchema = flatmatesProfileSchema
  .omit({
    id: true,
    email: true,
    phone: true,
    last_active_at: true
  })
  .partial()
  .refine(budgetRefine.check, budgetRefine.opts);

export const flatmatesPeerSchema = flatmatesProfileSchema
  .pick({
    id: true,
    full_name: true,
    profile_image_url: true,
    mode: true,
    city: true,
    locality: true,
    age: true,
    profession: true,
    bio: true,
    budget_min: true,
    budget_max: true,
    move_in_timeline: true,
    sleep_schedule: true,
    cleanliness: true,
    food_habits: true,
    smoking_drinking: true,
    guests_policy: true,
    work_style: true,
    gender: true,
    gender_preference: true
  })
  .extend({
    non_negotiables: z.array(nonNegotiableSchema).default([]),
    has_pets: z.boolean().optional(),
    party_habit: z.string().optional(),
    match_percentage: z.number().min(0).max(100).optional(),
    phone_number: z.string().optional()
  });

export type LifestyleInput = z.infer<typeof lifestyleSchema>;
export type FlatmatesProfileInput = z.infer<typeof flatmatesProfileSchema>;
export type FlatmatesProfileUpdateInput = z.infer<
  typeof flatmatesProfileUpdateSchema
>;
export type FlatmatesPeerInput = z.infer<typeof flatmatesPeerSchema>;

export const flatmatesBootstrapSchema = z.object({
  profile: flatmatesProfileSchema,
  catalogs: z.array(z.object({
    key: z.string(),
    version: z.number(),
    payload: jsonObjectSchema
  })),
  active_listing_count: z.number().int().min(0).catch(0),
  conversation_count: z.number().int().min(0).catch(0),
  unread_message_count: z.number().int().min(0).catch(0)
});

export type FlatmatesBootstrapInput = z.infer<typeof flatmatesBootstrapSchema>;

