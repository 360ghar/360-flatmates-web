import type {
  AlertChannel,
  AlertFrequency,
  FlatmatesMode,
  FurnishingLevel,
  GenderPreference,
  KitchenType,
  ListingSharingType,
  MoveInFilter,
  PropertyPurpose,
  PropertyType,
  SearchSort,
  VentilationType
} from "@/lib/data";
import type { Property } from "./property.types";

/**
 * Search filters of the web UI. Each key is a declared query key of
 * `GET /properties`. `sharing_type`, `gender_preference` and `move_in` take
 * one value: the backend does not accept lists for them.
 */
export interface SearchFilters {
  q?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  property_type?: PropertyType[];
  purpose?: PropertyPurpose;
  city?: string;
  locality?: string;
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  sharing_type?: ListingSharingType;
  gender_preference?: GenderPreference;
  move_in?: MoveInFilter;
  available_from?: string;
  amenities?: string[];
  features?: string[];
  furnishing?: FurnishingLevel[];
  kitchen_type?: KitchenType[];
  ventilation_type?: VentilationType[];
  windows_min?: number;
  has_lift?: boolean;
  sort_by?: SearchSort;
  semantic_search?: boolean;
  exclude_swiped?: boolean;
  cursor?: string;
  limit?: number;
}

/** One page of a property search, as the search hooks hand it to the UI. */
export interface WebSearchResponse {
  results: Property[];
  total?: number;
  next_cursor: string | null;
  has_more: boolean;
  limit: number;
}

export interface SavedSearchCreate {
  name: string;
  filters: SearchFilters;
  alert_enabled?: boolean;
  alert_frequency?: AlertFrequency;
  alert_channels?: AlertChannel[];
}

export type SavedSearchUpdate = Partial<SavedSearchCreate>;

export interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  filters: SearchFilters;
  alert_enabled: boolean;
  alert_frequency: AlertFrequency;
  alert_channels: AlertChannel[];
  last_run_at?: string;
  new_results_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SearchAlertCreate {
  name: string;
  filters: SearchFilters;
  frequency?: AlertFrequency;
  channels?: AlertChannel[];
}

export interface SearchAlertUpdate {
  name?: string;
  filters?: SearchFilters;
  frequency?: AlertFrequency;
  channels?: AlertChannel[];
  enabled?: boolean;
}

export interface SearchAlert {
  id: number;
  user_id: number;
  name: string;
  filters: SearchFilters;
  frequency: AlertFrequency;
  channels: AlertChannel[];
  enabled: boolean;
  last_sent_at?: string;
  results_sent_count?: number;
  created_at?: string;
}

/** Map pin built from a listing in `GET /properties` (UI type). */
export interface MapPin {
  id: number;
  lat: number;
  lng: number;
  title: string;
  locality?: string | null;
  monthly_rent?: number | null;
  main_image_url?: string | null;
  mode?: FlatmatesMode;
  sharing_type?: ListingSharingType | null;
  is_available?: boolean;
}

export interface MapCluster {
  id: string;
  lat: number;
  lng: number;
  count: number;
  type_breakdown?: {
    room_available?: number;
    co_hunter?: number;
  };
  price_range?: {
    min?: number;
    max?: number;
  };
}

export interface MapViewFilters {
  lat: number;
  lng: number;
  radius?: number;
  zoom_level?: number;
  property_type?: PropertyType[];
  price_min?: number;
  price_max?: number;
  move_in?: MoveInFilter;
  city?: string;
  locality?: string;
  sharing_type?: ListingSharingType;
  gender_preference?: GenderPreference;
  amenities?: string[];
  furnishing?: FurnishingLevel[];
  kitchen_type?: KitchenType[];
  ventilation_type?: VentilationType[];
  windows_min?: number;
  has_lift?: boolean;
}

export interface MapViewResponse {
  clusters: MapCluster[];
  pins: MapPin[];
  bounds?: {
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  };
  total_listings: number;
}

export interface SwipeDeckParams {
  limit?: number;
  cursor?: string;
  city?: string;
  budget_min?: number;
  budget_max?: number;
}
