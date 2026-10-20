import type { ListingModerationStatus } from "@/lib/data";
import type { Schemas, WriteBody } from "./schema";

/** `GET /properties`, `GET /properties/me` and write responses. */
export type Property = Schemas["Property"];
/** `GET /properties/{id}`: a `Property` plus the detail-only fields. */
export type PropertyDetail = Schemas["PropertyDetail"];
export type PropertyImage = Schemas["PropertyImage"];
export type ListingPreferences = Schemas["ListingPreferences"];
export type PropertyCursorPage = Schemas["CursorPage_Property_"];

/**
 * Body of `POST /properties`. `country` and `minimum_stay_days` have server
 * defaults, so a client may omit them. `base_price` is required and equals
 * `monthly_rent` for a rent listing.
 */
export type PropertyCreate = WriteBody<
  Schemas["PropertyCreate"],
  "country" | "minimum_stay_days"
>;

/** Body of `PUT /properties/{id}`: PATCH semantics, send only changed keys. */
export type PropertyUpdate = Schemas["PropertyUpdate"];

/** The owner's own status toggle: `listing_preferences.moderation_status`. */
export type OwnerListingStatus = "live" | "paused";

/** UI summary of an owner's listings (derived from `GET /properties/me`). */
export interface RoomPosterDashboard {
  total_listings: number;
  active_listings: number;
  pending_review: number;
  paused: number;
  total_views: number;
  total_likes: number;
  total_conversations: number;
  listings: Array<{
    id: number;
    title: string;
    status: ListingModerationStatus;
    views: number;
    likes: number;
    conversations: number;
  }>;
}

/** UI summary of one listing (derived from the listing's own counters). */
export interface ListingAnalytics {
  listing_id: number;
  period: "7d" | "30d" | "all";
  total_views: number;
  unique_views: number;
  likes: number;
  shares: number;
  conversations_started: number;
  daily_stats: Array<{
    date: string;
    views: number;
    likes: number;
    shares: number;
  }>;
}
