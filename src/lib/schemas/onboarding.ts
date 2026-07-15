import { z } from "zod";
import {
  flatmatesModeSchema,
  genderPreferenceSchema,
  moveInTimelineSchema,
  nonNegotiableSchema
} from "./enums";
import { minMaxRefine } from "./common";
import { lifestyleSchema } from "./profile";

export const ONBOARDING_DRAFT_STORAGE_KEY = "360-flatmates-onboarding-draft";

export const onboardingStepSchema = z.number().int().min(0).max(9);

export const onboardingLocationSchema = z.object({
  city: z.string().min(1),
  locality: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().min(1).optional()
  ),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const onboardingBasicInfoSchema = z.object({
  full_name: z.string().min(2).max(120),
  age: z.number().int().min(18).max(100),
  profession: z.string().min(1).max(120)
});

export const onboardingBudgetTimelineFieldsSchema = z.object({
  budget_min: z.number().min(0).max(100000),
  budget_max: z.number().min(0).max(100000),
  move_in_timeline: moveInTimelineSchema
});

const budgetRefine = minMaxRefine("budget_min", "budget_max", "Minimum budget cannot exceed maximum budget");

export const onboardingBudgetTimelineSchema = onboardingBudgetTimelineFieldsSchema
  .refine(budgetRefine.check, budgetRefine.opts);

export const onboardingPreferencesSchema = z.object({
  gender_preference: genderPreferenceSchema.default("any"),
  non_negotiables: z.array(nonNegotiableSchema).max(10).default([])
});

export const onboardingDraftSchema = z.object({
  current_step: onboardingStepSchema.default(0),
  mode: flatmatesModeSchema.optional(),
  location: onboardingLocationSchema.partial().optional(),
  basic_info: onboardingBasicInfoSchema.partial().optional(),
  profile_image_url: z.url().optional(),
  lifestyle: lifestyleSchema.partial().optional(),
  budget_timeline: onboardingBudgetTimelineFieldsSchema.partial().optional(),
  preferences: onboardingPreferencesSchema.partial().optional(),
  updated_at: z.string().optional()
});

export const completedOnboardingSchema = onboardingDraftSchema.extend({
  mode: flatmatesModeSchema,
  location: onboardingLocationSchema,
  basic_info: onboardingBasicInfoSchema,
  lifestyle: lifestyleSchema,
  budget_timeline: onboardingBudgetTimelineSchema,
  preferences: onboardingPreferencesSchema
});

export type OnboardingDraft = z.infer<typeof onboardingDraftSchema>;
export type CompletedOnboarding = z.infer<typeof completedOnboardingSchema>;
