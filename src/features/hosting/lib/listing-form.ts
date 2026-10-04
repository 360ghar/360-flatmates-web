import { z } from "zod";
import {
  furnishingLevelSchema,
  genderPreferenceSchema,
  kitchenTypeSchema,
  listingSharingTypeSchema,
  societyTypeSchema,
  ventilationTypeSchema,
} from "@/lib/schemas/enums";

/** Edit form for an existing listing (MyListingEditPage and its field groups). */
export const listingSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(2000).optional(),
  city: z.string().min(1, "City is required").max(60),
  locality: z.string().min(1, "Locality is required").max(80),
  sub_locality: z.string().max(80).optional(),
  address: z.string().max(200).optional(),
  monthly_rent: z.number().min(1, "Rent is required"),
  security_deposit: z.number().min(0).optional(),
  maintenance_charges: z.number().min(0).optional(),
  setup_cost: z.number().min(0).optional(),
  other_charges: z.number().min(0).optional(),
  other_charges_description: z.string().max(300).optional(),
  area_sqft: z.number().min(0).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  floor_number: z.number().min(0).optional(),
  total_floors: z.number().min(1).optional(),
  kitchen_type: kitchenTypeSchema.optional(),
  ventilation_type: ventilationTypeSchema.optional(),
  windows_count: z.number().int().min(0).max(100).optional(),
  ventilation_shafts: z.number().int().min(0).max(50).optional(),
  furnishing_level: furnishingLevelSchema.optional(),
  available_from: z.string().optional(),
  gender_preference: genderPreferenceSchema.optional(),
  sharing_type: listingSharingTypeSchema.optional(),
  society_type: societyTypeSchema.optional(),
  video_tour_url: z.url().optional().or(z.literal("")),
  is_available: z.boolean().optional()
});

export type ListingFormData = z.infer<typeof listingSchema>;
