import { z } from "zod";
import {
  genderPreferenceSchema,
  jsonObjectSchema,
  listingSharingTypeSchema,
  propertyPurposeSchema,
  propertyTypeSchema,
  societyTypeSchema
} from "./enums";
import { optionalUrlSchema } from "./common";

export const LISTING_DRAFT_STORAGE_KEY = "360-flatmates-listing-draft";
const optionalUrlArraySchema = z.array(z.string().url()).default([]);

export const listingLocationStepSchema = z.object({
  society_name: z.string().min(1).max(160).optional(),
  address: z.string().min(1).max(300),
  city: z.string().min(1).max(80),
  state: z.string().max(80).optional(),
  locality: z.string().min(1).max(120),
  sub_locality: z.string().max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional()
});

export const listingSocietyStepSchema = z.object({
  society_type: societyTypeSchema,
  society_amenities: z.array(z.string()).default([]),
  society_vibe_tags: z.array(z.string()).default([])
});

export const listingRoomStepSchema = z.object({
  sharing_type: listingSharingTypeSchema,
  furnishing: z.string().optional(),
  features: z.array(z.string()).default([]),
  main_image_url: optionalUrlSchema,
  image_urls: optionalUrlArraySchema,
  video_tour_url: optionalUrlSchema
});

export const listingFlatStepSchema = z.object({
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area_sqft: z.number().min(0).optional(),
  floor: z.number().int().optional(),
  total_floors: z.number().int().optional(),
  flat_amenities: z.array(z.string()).default([])
});

export const listingCostsStepSchema = z.object({
  monthly_rent: z.number().min(500),
  security_deposit: z.number().min(0).optional(),
  maintenance_charges: z.number().min(0).optional(),
  electricity_charges: z.number().min(0).optional(),
  cook_maid_charges: z.number().min(0).optional(),
  setup_cost: z.number().min(0).optional()
});

export const listingAboutStepSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().max(5000).optional(),
  typical_day: z.string().max(1000).optional(),
  gender_preference: genderPreferenceSchema.default("any"),
  preferred_age_min: z.number().int().min(18).max(100).optional(),
  preferred_age_max: z.number().int().min(18).max(100).optional(),
  available_from: z.string().optional(),
  non_negotiables: z.array(z.string()).default([])
});

export const propertyCreateSchema = z
  .object({
    property_type: propertyTypeSchema.default("flatmate"),
    purpose: propertyPurposeSchema.default("rent"),
    title: z.string().min(5).max(200),
    description: z.string().max(5000).optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    locality: z.string().min(1),
    sub_locality: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    monthly_rent: z.number().min(500),
    security_deposit: z.number().min(0).optional(),
    maintenance_charges: z.number().min(0).optional(),
    area_sqft: z.number().min(0).optional(),
    bedrooms: z.number().int().min(0).max(20).optional(),
    bathrooms: z.number().int().min(0).max(20).optional(),
    features: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    main_image_url: optionalUrlSchema,
    image_urls: optionalUrlArraySchema,
    available_from: z.string().optional(),
    gender_preference: genderPreferenceSchema.optional(),
    sharing_type: listingSharingTypeSchema.optional(),
    video_tour_url: optionalUrlSchema,
    society_type: societyTypeSchema.optional(),
    society_amenities: z.array(z.string()).default([]),
    society_vibe_tags: z.array(z.string()).default([]),
    listing_preferences: jsonObjectSchema.optional()
  })
  .refine(
    (value) =>
      value.security_deposit === undefined ||
      value.security_deposit <= value.monthly_rent * 12,
    {
      message: "Security deposit is unusually high",
      path: ["security_deposit"]
    }
  );

export const propertySchema = propertyCreateSchema.extend({
  id: z.number().int().positive(),
  owner_id: z.number().int().positive().optional(),
  owner_name: z.string().optional(),
  interest_count: z.number().int().min(0).optional(),
  view_count: z.number().int().min(0).optional(),
  like_count: z.number().int().min(0).optional(),
  is_available: z.boolean().optional(),
  created_at: z.string().optional(),
  preferences: jsonObjectSchema.optional(),
  status: z.enum(["draft", "active", "paused", "expired"]).optional(),
  property_status: z.enum(["pending_review", "approved", "rejected"]).optional(),
  expires_at: z.string().optional(),
  distance_km: z.number().optional(),
  liked: z.boolean().nullable().optional(),
  user_has_scheduled_visit: z.boolean().optional(),
  user_scheduled_visit_count: z.number().int().min(0).optional(),
  user_next_visit_date: z.string().optional(),
  owner: z
    .object({
      id: z.number().int().positive(),
      full_name: z.string(),
      profile_image_url: optionalUrlSchema,
      phone: z.string().optional()
    })
    .optional()
});

export const listingDraftSchema = z.object({
  location: listingLocationStepSchema.partial().optional(),
  society: listingSocietyStepSchema.partial().optional(),
  room: listingRoomStepSchema.partial().optional(),
  flat: listingFlatStepSchema.partial().optional(),
  costs: listingCostsStepSchema.partial().optional(),
  about: listingAboutStepSchema.partial().optional(),
  updated_at: z.string().optional()
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
export type ListingDraft = z.infer<typeof listingDraftSchema>;

