import { useMemo } from "react";
import { useNavigate } from "react-router";
import { useDashboardStats } from "@/hooks/queries";
import type { RoomPosterDashboard } from "@/lib/api/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
import {
  DashboardPanel,
  type DashboardMetric,
  type ListingPerformanceRow
} from "@/components/organisms/DashboardPanel";

function mapDashboardMetrics(stats: RoomPosterDashboard): DashboardMetric[] {
  return [
    {
      label: "Active Listings",
      value: String(stats.active_listings),
      trend: stats.active_listings > 0 ? "up" : "flat",
      helper: `${stats.pending_review} pending review`
    },
    {
      label: "Views (30d)",
      value: String(stats.total_views_30d),
      trend: stats.total_views_30d > 0 ? "up" : "flat"
    },
    {
      label: "Likes (30d)",
      value: String(stats.total_likes_30d),
      trend: stats.total_likes_30d > 0 ? "up" : "flat"
    },
    {
      label: "Visits (30d)",
      value: String(stats.total_visits_30d),
      trend: stats.total_visits_30d > 0 ? "up" : "flat"
    }
  ];
}

function mapListingRows(stats: RoomPosterDashboard): ListingPerformanceRow[] {
  return stats.listings.map((listing) => ({
    id: String(listing.id),
    title: listing.title,
    views: listing.views,
    likes: listing.likes,
    conversations: listing.conversations,
    visits: 0,
    boostStatus: listing.boost_active ? "active" : "inactive"
  }));
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  const metrics = useMemo(() => stats ? mapDashboardMetrics(stats) : [], [stats]);
  const rows = useMemo(() => stats ? mapListingRows(stats) : [], [stats]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 page-fade">
        <div className="h-7 w-32 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="statCard" />)}
        </div>
        <div className="rounded-2xl border border-line bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <div className="h-5 w-32 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
          </div>
          <div className="border-b border-line bg-paper-2 px-4 py-2 flex gap-4">
            <div className="h-3 w-20 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
            <div className="h-3 w-10 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
            <div className="h-3 w-10 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
            <div className="h-3 w-10 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
          </div>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="border-b border-line-2 last:border-b-0 px-4 py-2 flex gap-4">
              <div className="h-4 w-24 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
              <div className="h-4 w-8 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
              <div className="h-4 w-8 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
              <div className="h-4 w-12 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center page-fade">
        <ErrorState
          title="Could not load dashboard"
          description="Try refreshing the page."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="page-fade">
      <h1 className="text-h1 mb-5">Dashboard</h1>
      <DashboardPanel
        metrics={metrics}
        rows={rows}
        onEdit={(listingId) => {
          navigate(`/my-listings/${listingId}/edit`);
        }}
        onBoost={(listingId) => {
          navigate(`/my-listings/${listingId}`);
        }}
        onViewAnalytics={(listingId) => {
          navigate(`/my-listings/${listingId}`);
        }}
      />
    </div>
  );
}
