import type { DevicePlatform, ShareCardFormat } from "@/lib/data";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | readonly JsonValue[];
export type JsonObject = { readonly [key: string]: JsonValue };

export interface CatalogEntry {
  key: string;
  version: number;
  payload: JsonObject;
}

export interface CatalogsResponse {
  catalogs: CatalogEntry[];
}

export interface CatalogCity {
  id: number;
  name: string;
  state?: string;
  is_active: boolean;
}

export interface CatalogLocality {
  id: number;
  name: string;
  city_id: number;
  city_name?: string;
}

export interface CatalogAmenity {
  id: number;
  name: string;
  category?: string;
  icon?: string;
}

export interface RegisterDevicePayload {
  device_token: string;
  platform?: DevicePlatform;
}

export interface ShareCardResponse {
  card_url: string;
  format: ShareCardFormat;
  expires_at?: string;
}

/** Generic cursor-based pagination envelope returned by all list endpoints. */
export interface CursorPage<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
  total?: number | null;
}
