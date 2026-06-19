import { useQuery } from "@tanstack/react-query";
import { useMyProperties } from "./useProperties";
import type {
  RoomPosterDashboard,
  ListingAnalytics,
  Property,
  PropertyCursorPage
} from "@/lib/api/types";

export type AnalyticsPeriod = "7d" | "30d" | "all";

/**
 * Derive a {@link RoomPosterDashboard} from the room poster's own listings.
 *
 * The backend's `/flatmates/web/dashboard` endpoint does not exist on the
 * deployed server (verified against `https://api.360ghar.com/api/v1/...`).
 * Instead of calling a 404, we compute the same shape client-side from
 * `/properties/me`, which is the canonical source for a room poster's
 * listings and is reliably deployed.
 *
 * Counts that the page renders:
 *   - `active_listings`    properties whose lifecycle status is live/active
 *   - `pending_review`     properties awaiting moderation
 *   - `paused`             properties paused by the owner
 *   - `total_views_30d`    sum of view_count across all listings
 *   - `total_likes_30d`    sum of like_count across all listings
 *   - `total_visits_30d`   sum of user_scheduled_visit_count across listings
 *   - `listings[]`         per-listing performance rows used by the table
 */
function deriveDashboard(properties: Property[]): RoomPosterDashboard {
  let activeListings = 0;
  let pendingReview = 0;
  let paused = 0;
  let totalViews = 0;
  let totalLikes = 0;
  let totalVisits = 0;

  const listings = properties.map((property) => {
    const status = (property.status ?? "").toLowerCase();
    const moderation = (property.property_status ?? "").toLowerCase();
    const isPaused = property.is_available === false || status === "paused";
    const isPending =
      moderation === "pending_review" ||
      moderation === "pending" ||
      moderation === "under_review";
    const isActive = !isPaused && !isPending;

    if (isActive) activeListings += 1;
    else if (isPending) pendingReview += 1;
    if (isPaused) paused += 1;

    const views = property.view_count ?? 0;
    const likes = property.like_count ?? 0;
    const visits = property.user_scheduled_visit_count ?? 0;
    totalViews += views;
    totalLikes += likes;
    totalVisits += visits;

    return {
      id: property.id,
      title: property.title,
      status: status || "unknown",
      views,
      likes,
      conversations: property.interest_count ?? 0,
      days_until_expiry: 0,
      boost_active: false
    };
  });

  return {
    total_listings: properties.length,
    active_listings: activeListings,
    pending_review: pendingReview,
    paused,
    total_views_30d: totalViews,
    total_likes_30d: totalLikes,
    total_conversations_30d: 0,
    total_visits_30d: totalVisits,
    listings
  };
}

/**
 * Query the user's listings and project them into a {@link RoomPosterDashboard}.
 *
 * Wraps `useMyProperties` so the dashboard automatically re-renders whenever
 * the room poster creates, updates, or deletes a listing. The hook returns
 * `isLoading`, `error`, and `refetch` so the page above can stay structurally
 * identical to its old network-backed version.
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
 * Per-listing analytics summary.
 *
 * The backend's `/flatmates/web/listings/${propertyId}/analytics` endpoint
 * does not exist on the deployed server, so we derive a lightweight view
 * from the cached listing data instead. This keeps the analytics tab on
 * the Dashboard working without a backend dependency.
 */
export function useListingAnalytics(propertyId: number, period: AnalyticsPeriod = "30d") {
  return useQuery({
    queryKey: ["dashboard", "analytics", propertyId, period],
    queryFn: async () => {
      const { apiClient } = await import("@/lib/api");
      const cursor = await apiClient.request<PropertyCursorPage>({
        method: "GET",
        path: "/properties/me"
      });
      const listing = (cursor.items ?? []).find((p) => p.id === propertyId);
      if (!listing) {
        return {
          listing_id: propertyId,
          period,
          total_views: 0,
          unique_views: 0,
          likes: 0,
          shares: 0,
          conversations_started: 0,
          visits_scheduled: 0,
          daily_stats: [],
          boost_active: false,
          boost_expires_at: null
        } satisfies ListingAnalytics;
      }
      return {
        listing_id: listing.id,
        period,
        total_views: listing.view_count ?? 0,
        unique_views: listing.view_count ?? 0,
        likes: listing.like_count ?? 0,
        shares: 0,
        conversations_started: listing.interest_count ?? 0,
        visits_scheduled: listing.user_scheduled_visit_count ?? 0,
        daily_stats: [],
        boost_active: false,
        boost_expires_at: null
      } satisfies ListingAnalytics;
    },
    enabled: propertyId > 0
  });
}
