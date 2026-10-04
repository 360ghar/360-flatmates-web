import { z } from "zod";
import {
  furnishingLevelSchema,
  genderPreferenceSchema,
  kitchenTypeSchema,
  listingSharingTypeSchema,
  societyTypeSchema,
  ventilationTypeSchema,
} from "@/lib/schemas/enums";

/**
 * Empty number inputs arrive as NaN via `valueAsNumber`; zod v4 rejects NaN,
 * so normalize it to undefined before validating optional numbers.
 */
const nanToUndefined = (value: unknown) =>
  typeof value === "number" && Number.isNaN(value) ? undefined : value;

const optionalNumber = (schema: z.ZodNumber) =>
  z.preprocess(nanToUndefined, schema.optional()) as unknown as z.ZodOptional<z.ZodNumber>;

/**
 * Edit form for an existing listing (MyListingEditPage and its field groups).
 * Bounds mirror the creation schema (`src/lib/schemas/listing-builder.ts`:
 * title max 200, description max 5000, monthly_rent min 500,
 * bedrooms/bathrooms int 0-20) so stored listings still validate on save.
 */
export const listingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  city: z.string().min(1, "City is required"),
  locality: z.string().min(1, "Locality is required"),
  sub_locality: z.string().optional(),
  address: z.string().optional(),
  monthly_rent: z.number().min(500, "Rent is required"),
  security_deposit: optionalNumber(z.number().min(0)),
  maintenance_charges: optionalNumber(z.number().min(0)),
  setup_cost: optionalNumber(z.number().min(0)),
  other_charges: optionalNumber(z.number().min(0)),
  other_charges_description: z.string().max(300).optional(),
  area_sqft: optionalNumber(z.number().min(0)),
  bedrooms: optionalNumber(z.number().int().min(0).max(20)),
  bathrooms: optionalNumber(z.number().int().min(0).max(20)),
  floor_number: optionalNumber(z.number().int().min(0)),
  total_floors: optionalNumber(z.number().int().min(1)),
  kitchen_type: kitchenTypeSchema.optional(),
  ventilation_type: ventilationTypeSchema.optional(),
  windows_count: optionalNumber(z.number().int().min(0).max(100)),
  ventilation_shafts: optionalNumber(z.number().int().min(0).max(50)),
  furnishing_level: furnishingLevelSchema.optional(),
  available_from: z.string().optional(),
  gender_preference: genderPreferenceSchema.optional(),
  sharing_type: listingSharingTypeSchema.optional(),
  society_type: societyTypeSchema.optional(),
  video_tour_url: z.url().optional().or(z.literal("")),
  is_available: z.boolean().optional()
});

export type ListingFormData = z.infer<typeof listingSchema>;
