import type { PropertyCreate, PropertyUpdate } from "@/lib/api/types";
import type { ListingFormData } from "./listing-form";

/**
 * State of the post-a-room wizard: the keys of `POST /properties` that the
 * wizard collects, plus the UI-only `address` (sent as `full_address`). The
 * wizard sets no `base_price`: it follows the rent. `image_urls` holds hosted
 * URLs from `POST /upload`; the backend makes the first one the main photo.
 */
type WizardKeys = Omit<PropertyCreate, "full_address" | "base_price" | "main_image_url">;

export type ListingDraftForm = { [K in keyof WizardKeys]?: NonNullable<WizardKeys[K]> } & {
  address?: string;
};

/**
 * Build the `POST /properties` body. A rent listing sends `base_price` equal to
 * `monthly_rent`. Returns null while a required field is missing.
 */
export function toPropertyCreate(form: ListingDraftForm): PropertyCreate | null {
  const { address, title, monthly_rent: monthlyRent, ...rest } = form;
  const trimmedTitle = title?.trim();
  if (!trimmedTitle || monthlyRent === undefined || !Number.isFinite(monthlyRent)) return null;

  const fullAddress = address?.trim();
  return {
    ...rest,
    property_type: rest.property_type ?? "flatmate",
    purpose: "rent",
    title: trimmedTitle,
    monthly_rent: monthlyRent,
    base_price: monthlyRent,
    ...(fullAddress ? { full_address: fullAddress } : {})
  };
}

/** Edit-form keys the user changed, as react-hook-form reports them. */
export type ListingDirtyFields = Partial<Record<keyof ListingFormData, boolean | undefined>>;

/** Edit-form keys the backend rejects when null. They are never cleared. */
const NOT_NULLABLE = new Set<keyof ListingFormData>(["title", "monthly_rent"]);

/**
 * Build the `PUT /properties/{id}` body: PATCH semantics. Only a changed key is
 * sent. A cleared optional field is sent as `null`. The form has no
 * `is_available`: availability is its own owner action (`useSetListingStatus`),
 * so a content edit never sends it. `base_price` follows `monthly_rent`.
 */
export function toPropertyUpdate(
  values: ListingFormData,
  dirty: ListingDirtyFields
): PropertyUpdate {
  const body: Record<string, unknown> = {};

  for (const key of Object.keys(dirty) as Array<keyof ListingFormData>) {
    if (!dirty[key]) continue;
    const value = values[key];
    const cleared = value === undefined || value === "" || (typeof value === "number" && Number.isNaN(value));
    if (cleared) {
      if (!NOT_NULLABLE.has(key)) body[key === "address" ? "full_address" : key] = null;
      continue;
    }
    body[key === "address" ? "full_address" : key] = value;
  }

  if (typeof body.monthly_rent === "number") body.base_price = body.monthly_rent;
  return body as PropertyUpdate;
}
