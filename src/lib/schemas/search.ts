import { z } from "zod";
import {
  alertChannelSchema,
  alertFrequencySchema,
  genderPreferenceSchema,
  moveInTimelineSchema,
  propertyPurposeSchema,
  propertyTypeSchema,
  searchSortSchema,
  searchTypeSchema,
  societyTypeSchema,
  listingSharingTypeSchema
} from "./enums";
import { minMaxRefine } from "./common";
import { flatmatesPeerSchema } from "./profile";
import { propertySchema } from "./listing-builder";

const priceRefine = minMaxRefine("price_min", "price_max", "Minimum price cannot exceed maximum price");
const bedroomsRefine = minMaxRefine("bedrooms_min", "bedrooms_max", "Minimum bedrooms cannot exceed maximum bedrooms");

export const searchFiltersSchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    search_type: searchTypeSchema.default("listings"),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    radius: z.number().int().min(1).max(100).default(5),
    property_type: z.array(propertyTypeSchema).optional(),
    purpose: propertyPurposeSchema.default("rent"),
    city: z.string().trim().optional(),
    locality: z.string().trim().optional(),
    sub_locality: z.string().trim().optional(),
    price_min: z.number().min(0).optional(),
    price_max: z.number().max(1000000000).optional(),
    bedrooms_min: z.number().int().min(0).optional(),
    bedrooms_max: z.number().int().max(20).optional(),
    sharing_type: z.array(listingSharingTypeSchema).optional(),
    gender_preference: z.array(genderPreferenceSchema).optional(),
    move_in: z.array(moveInTimelineSchema).optional(),
    available_from: z.string().optional(),
    amenities: z.array(z.string()).optional(),
    features: z.array(z.string()).optional(),
    society_type: societyTypeSchema.optional(),
    society_vibe_tags: z.array(z.string()).optional(),
    sort_by: searchSortSchema.default("newest"),
    semantic_search: z.boolean().default(false),
    exclude_swiped: z.boolean().default(false),
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(20)
  })
  .refine(priceRefine.check, priceRefine.opts)
  .refine(bedroomsRefine.check, bedroomsRefine.opts);

const _webSearchResponseSchema = z.object({
  results: z.array(z.union([propertySchema, flatmatesPeerSchema])),
  total: z.number().int().min(0).optional(),
  next_cursor: z.string().nullable(),
  has_more: z.boolean(),
  limit: z.number().int().min(1),
  search_type: searchTypeSchema,
  filters_applied: z.record(z.string(), z.unknown()).optional(),
  search_center: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional()
    })
    .optional()
});

export const savedSearchCreateSchema = z.object({
  name: z.string().min(1).max(100),
  filters: searchFiltersSchema,
  alert_enabled: z.boolean().default(false),
  alert_frequency: alertFrequencySchema.default("daily"),
  alert_channels: z.array(alertChannelSchema).default(["in_app"])
});

const _savedSearchSchema = savedSearchCreateSchema.extend({
  id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  alert_enabled: z.boolean(),
  alert_frequency: alertFrequencySchema,
  alert_channels: z.array(alertChannelSchema),
  last_run_at: z.string().optional(),
  new_results_count: z.number().int().min(0).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
});

export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;
export type WebSearchResponseInput = z.infer<typeof _webSearchResponseSchema>;
export type SavedSearchInput = z.infer<typeof _savedSearchSchema>;

