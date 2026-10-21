import type { Schemas } from "./schema";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export type JsonObject = Record<string, unknown>;

export type CatalogEntry = Schemas["CatalogEntry"];
export type CatalogCursorPage = Schemas["CursorPage_CatalogEntry_"];

/** Items of the `cities` catalog payload (UI view of a catalog entry). */
export interface CatalogCity {
  id: number;
  name: string;
  state?: string;
  is_active: boolean;
}

export interface CatalogAmenity {
  id: number;
  name: string;
  category?: string;
  icon?: string;
}

/** Body of `POST /notifications/devices/register`. The web app is `flatmates`. */
export type RegisterDevicePayload = Schemas["DeviceRegisterIn"];

/** Body of `DELETE /notifications/devices/unregister`. */
export type UnregisterDevicePayload = Schemas["DeviceUnregisterIn"];

/** Every list route returns this envelope. All five keys are always present. */
export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
  /** Null unless the request sent `include_total=true`. */
  total: number | null;
}

/** Error envelope of every non-2xx JSON response. */
export type ErrorEnvelope = Schemas["ErrorEnvelope"];
/** Error envelope of a 422. `details.fields` is always present. */
export type ValidationErrorEnvelope = Schemas["ValidationErrorEnvelope"];
