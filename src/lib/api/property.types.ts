import type {
  GenderPreference,
  ListingSharingType,
  MoveInTimeline,
  PropertyLifecycleStatus,
  PropertyModerationStatus,
  PropertyPurpose,
  PropertyType,
  SocietyType
} from "@/lib/data";
import type { JsonObject } from "./common.types";

export interface PropertyCreate {
  property_type: PropertyType;
  purpose: PropertyPurpose;
  title: string;
  description?: string;
  city: string;
  state?: string;
  locality: string;
  sub_locality?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  monthly_rent: number;
  security_deposit?: number;
  maintenance_charges?: number;
  area_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  tags?: string[];
  main_image_url?: string;
  image_urls?: string[];
  available_from?: string;
  gender_preference?: GenderPreference;
  sharing_type?: ListingSharingType;
  video_tour_url?: string;
  society_type?: SocietyType;
  society_amenities?: string[];
  society_vibe_tags?: string[];
  listing_preferences?: JsonObject;
}

export type PropertyUpdate = Partial<Omit<PropertyCreate, "property_type" | "purpose">> & {
  is_available?: boolean;
};

export interface PropertyOwner {
  id: number;
  full_name: string;
  profile_image_url?: string;
  phone?: string;
}

export interface Property {
  id: number;
  owner_id?: number;
  property_type: PropertyType;
  purpose: PropertyPurpose;
  title: string;
  description?: string;
  city: string;
  state?: string;
  locality: string;
  sub_locality?: string;
  latitude?: number;
  longitude?: number;
  monthly_rent: number;
  main_image_url?: string;
  image_urls?: string[];
  area_sqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  tags?: string[];
  owner_name?: string;
  available_from?: string;
  gender_preference?: GenderPreference;
  sharing_type?: ListingSharingType;
  video_tour_url?: string;
  security_deposit?: number;
  maintenance_charges?: number;
  society_type?: SocietyType;
  society_amenities?: string[];
  society_vibe_tags?: string[];
  interest_count?: number;
  view_count?: number;
  like_count?: number;
  is_available?: boolean;
  created_at?: string;
  preferences?: JsonObject;
  status?: PropertyLifecycleStatus;
  property_status?: PropertyModerationStatus;
  expires_at?: string;
  distance_km?: number;
  liked?: boolean | null;
  user_has_scheduled_visit?: boolean;
  user_scheduled_visit_count?: number;
  user_next_visit_date?: string;
  owner?: PropertyOwner;
}

export interface PaginatedPropertyResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters_applied?: JsonObject;
  search_center?: {
    latitude?: number;
    longitude?: number;
  };
}

export interface PropertyImageUploadPayload {
  image_url: string;
  is_main?: boolean;
}

export interface PropertyImageUploadResponse {
  image_url: string;
  is_main: boolean;
}

export interface BoostListingPayload {
  duration: import("./common.types").BoostDuration;
}

export interface BoostListingResponse {
  boost_until: string;
  message: string;
}

export interface RenewListingPayload {
  available_from: string;
  expires_at: string;
}

export interface RoomPosterDashboard {
  total_listings: number;
  active_listings: number;
  pending_review: number;
  paused: number;
  total_views_30d: number;
  total_likes_30d: number;
  total_conversations_30d: number;
  total_visits_30d: number;
  listings: Array<{
    id: number;
    title: string;
    status: string;
    views: number;
    likes: number;
    conversations: number;
    days_until_expiry: number;
    boost_active: boolean;
  }>;
}

export interface ListingAnalytics {
  listing_id: number;
  period: "7d" | "30d" | "all" | string;
  total_views: number;
  unique_views: number;
  likes: number;
  shares: number;
  conversations_started: number;
  visits_scheduled: number;
  daily_stats: Array<{
    date: string;
    views: number;
    likes: number;
    shares: number;
  }>;
  boost_active: boolean;
  boost_expires_at?: string | null;
}

export interface CityStats {
  city: string;
  active_users: number;
  total_listings: number;
  new_listings_7d: number;
  total_matches_7d: number;
  match_rate: number;
  is_waitlist: boolean;
}
