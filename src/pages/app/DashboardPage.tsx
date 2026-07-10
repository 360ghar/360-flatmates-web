import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { useDashboardStats } from "@/hooks/queries";
import type { RoomPosterDashboard } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import {
  DashboardPanel,
  type DashboardMetric,
  type ListingPerformanceRow
} from "@/components/organisms/DashboardPanel";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-IN");

function formatCount(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

function mapDashboardMetrics(stats: RoomPosterDashboard): DashboardMetric[] {
  // TODO: F5 — the trend arrow was removed because the previous logic just
  // reported "up" for any non-zero count (no real delta). A meaningful trend
  // needs the API to return a previous-period value; until then, no arrow.
  return [
    {
      label: "Active Listings",
      value: formatCount(stats.active_listings),
      helper:
        stats.pending_review > 0
          ? `${formatCount(stats.pending_review)} pending review`
          : undefined
    },
    {
      label: "Views",
      value: formatCount(stats.total_views_30d)
    },
    {
      label: "Likes",
      value: formatCount(stats.total_likes_30d)
    },
    {
      label: "Visits",
      value: formatCount(stats.total_visits_30d)
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
    boostStatus: listing.boost_active ? "active" : "inactive"
  }));
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  const metrics = useMemo(() => stats ? mapDashboardMetrics(stats) : [], [stats]);
  const rows = useMemo(() => stats ? mapListingRows(stats) : [], [stats]);

  return (
    <div className="page-fade">
      <h1 className="text-h1 mb-5">Dashboard</h1>

      {isLoading ? (
        <Skeleton variant="dashboardPanel" />
      ) : error ? (
        <Card className="flex items-center justify-center p-8">
          <ErrorState
            title="Could not load dashboard stats"
            description="Please try again."
            onRetry={() => refetch()}
          />
        </Card>
      ) : stats && rows.length === 0 ? (
        <Card className="flex items-center justify-center p-8">
          <EmptyState
            title="No listings yet"
            description="Post a room to start tracking views, likes, and chats from potential flatmates."
            actionLabel="Post a listing"
            onAction={() => navigate("/post")}
            icon={<Plus aria-hidden="true" className="h-6 w-6" />}
          />
        </Card>
      ) : stats ? (
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
            navigate(`/dashboard/analytics?propertyId=${listingId}`);
          }}
        />
      ) : null}
    </div>
  );
}
