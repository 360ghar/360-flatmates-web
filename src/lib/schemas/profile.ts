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
  id: z.number().int().positive(),
  full_name: z.string().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  profile_image_url: optionalUrlSchema,
  mode: flatmatesModeSchema,
  profile_status: profileStatusSchema.optional(),
  onboarding_completed: z.boolean(),
  onboarding_current_step: z.number().int().min(0).max(7).optional(),
  bio: z.string().max(500).optional(),
  age: z.number().int().min(18).max(100).optional(),
  profession: z.string().max(120).optional(),
  budget_min: z.number().min(0).optional(),
  budget_max: z.number().min(0).optional(),
  move_in_timeline: moveInTimelineSchema.optional(),
  city: z.string().min(1).optional(),
  locality: z.string().min(1).optional(),
  sleep_schedule: sleepScheduleSchema.optional(),
  cleanliness: cleanlinessSchema.optional(),
  food_habits: foodHabitsSchema.optional(),
  smoking_drinking: smokingDrinkingSchema.optional(),
  guests_policy: guestsPolicySchema.optional(),
  work_style: workStyleSchema.optional(),
  gender: z.string().optional(),
  gender_preference: genderPreferenceSchema.optional(),
  preferences: jsonObjectSchema.optional(),
  last_active_at: z.string().optional()
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

