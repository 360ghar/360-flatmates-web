import { useQuery } from "@tanstack/react-query";
import { myPropertiesOptions, useMyProperties } from "@/features/listings/hooks/useProperties";
import { ownerListingStatus } from "@/lib/api/property-fields";
import type { ListingAnalytics, Property, RoomPosterDashboard } from "@/lib/api/types";

export type AnalyticsPeriod = "7d" | "30d" | "all";

/**
 * Derive a {@link RoomPosterDashboard} from the room poster's own listings.
 *
 * The backend has no dashboard route for a room poster, so the numbers come
 * from `GET /properties/me` (every page of it):
 *   - `active_listings`   listings that are live
 *   - `pending_review`    listings waiting for a moderator
 *   - `paused`            listings the owner paused
 *   - `total_views`       lifetime sum of `view_count`
 *   - `total_likes`       lifetime sum of `like_count`
 *   - `listings[]`        per-listing rows for the table
 * The state of a listing is `listing_preferences.moderation_status`.
 */
function deriveDashboard(properties: Property[]): RoomPosterDashboard {
  let activeListings = 0;
  let pendingReview = 0;
  let paused = 0;
  let totalViews = 0;
  let totalLikes = 0;

  const listings = properties.map((property) => {
    const status = ownerListingStatus(property);
    if (status === "live") activeListings += 1;
    else if (status === "pending_review") pendingReview += 1;
    else if (status === "paused") paused += 1;

    totalViews += property.view_count;
    totalLikes += property.like_count;

    return {
      id: property.id,
      title: property.title,
      status,
      views: property.view_count,
      likes: property.like_count,
      conversations: property.interest_count
    };
  });

  return {
    total_listings: properties.length,
    active_listings: activeListings,
    pending_review: pendingReview,
    paused,
    total_views: totalViews,
    total_likes: totalLikes,
    total_conversations: 0,
    listings
  };
}

/**
 * Query the user's listings and project them into a {@link RoomPosterDashboard}.
 *
 * Wraps `useMyProperties` so the dashboard re-renders whenever the room poster
 * creates, updates, or deletes a listing.
 */
export function useDashboardStats() {
  const { data: properties, isLoading, error, refetch } = useMyProperties();

  const dashboard: RoomPosterDashboard | undefined = properties
    ? deriveDashboard(properties)
    : undefined;

  return {
    data: dashboard,
    isLoading,
    error,
    refetch,
    // Surface the underlying listings for callers that want them.
    properties: properties ?? []
  };
}

/**
 * Per-listing analytics summary, read from the listing's own counters. There
 * is no analytics route, so there is no per-day series.
 */
export function useListingAnalytics(propertyId: number, period: AnalyticsPeriod = "30d") {
  return useQuery({
    ...myPropertiesOptions,
    select: (properties): ListingAnalytics => {
      const listing = properties.find((p) => p.id === propertyId);
      return {
        listing_id: propertyId,
        period,
        total_views: listing?.view_count ?? 0,
        unique_views: listing?.view_count ?? 0,
        likes: listing?.like_count ?? 0,
        shares: 0,
        conversations_started: listing?.interest_count ?? 0,
        daily_stats: []
      };
    },
    enabled: propertyId > 0
  });
}
