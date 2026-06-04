import type {
  AlertChannel,
  AlertFrequency,
  FlatmatesMode,
  GenderPreference,
  ListingSharingType,
  MoveInTimeline,
  PropertyPurpose,
  PropertyType,
  SearchSort,
  SearchType,
  SocietyType,
  SwipeAction,
  SwipeTargetType
} from "@/lib/data";
import type { FlatmatesPeer } from "./user.types";
import type { Property } from "./property.types";
import type { JsonObject } from "./common.types";

export interface SearchFilters {
  q?: string;
  search_type?: SearchType;
  lat?: number;
  lng?: number;
  radius?: number;
  property_type?: PropertyType[];
  purpose?: PropertyPurpose;
  city?: string;
  locality?: string;
  sub_locality?: string;
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  sharing_type?: ListingSharingType[];
  gender_preference?: GenderPreference[];
  move_in?: MoveInTimeline[];
  available_from?: string;
  amenities?: string[];
  features?: string[];
  society_type?: SocietyType;
  society_vibe_tags?: string[];
  sort_by?: SearchSort;
  semantic_search?: boolean;
  exclude_swiped?: boolean;
  page?: number;
  limit?: number;
}

export interface WebSearchResponse {
  results: Array<Property | FlatmatesPeer>;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  search_type: SearchType;
  filters_applied?: JsonObject;
  search_center?: {
    latitude?: number;
    longitude?: number;
  };
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

export interface MapPin {
  id: number;
  lat: number;
  lng: number;
  title: string;
  locality?: string;
  monthly_rent?: number;
  main_image_url?: string;
  mode?: FlatmatesMode;
  sharing_type?: ListingSharingType;
  is_available?: boolean;
  move_in_timeline?: MoveInTimeline;
}

export interface MapViewFilters {
  lat: number;
  lng: number;
  radius?: number;
  zoom_level?: number;
  property_type?: PropertyType[];
  price_min?: number;
  price_max?: number;
  move_in?: MoveInTimeline[];
  sharing_type?: ListingSharingType[];
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
  offset?: number;
  city?: string;
  budget_min?: number;
  budget_max?: number;
}

export interface SwipeHistoryParams {
  action?: SwipeAction;
  target_type?: SwipeTargetType;
  limit?: number;
  offset?: number;
}

export interface SwipeHistoryItem {
  id: number;
  target_type: SwipeTargetType;
  action: SwipeAction;
  target_user_id?: number;
  property_id?: number;
  did_match?: boolean;
  created_at: string;
}

export interface SwipeHistoryResponse {
  history: SwipeHistoryItem[];
  total: number;
}

export interface SwipeRequest {
  target_type: SwipeTargetType;
  action: SwipeAction;
  property_id?: number;
  target_user_id?: number;
  context_property_id?: number;
}

export interface SwipeResult {
  stored?: boolean;
  action: SwipeAction;
  target_type: SwipeTargetType;
  conversation_id?: number;
  match_id?: number;
  did_match?: boolean;
}
