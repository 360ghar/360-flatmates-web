import { useSearchParams } from "react-router";
import { useListingAnalytics } from "@/features/hosting/hooks/useDashboard";
import { DashboardPanelSkeleton } from "@/features/hosting/components/DashboardPanelSkeleton";
import { EmptyState, InlineError } from "@/components/ui/StateViews";
import { Page, PageHeader } from "@/components/ui/Layout";
import { StatCard } from "@/features/hosting/components/StatCard";
import { formatCount } from "@/lib/utils/format";

export function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  const propertyIdRaw = searchParams.get("propertyId") ?? "0";
  const propertyId = Number(propertyIdRaw);
  const { data: analytics, isLoading, error, refetch } = useListingAnalytics(propertyId);

  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    return (
      <Page width="wide">
        <PageHeader title="Listing analytics" />
        <div className="paper-grain rounded-hand bg-surface py-6 shadow-xs">
          <EmptyState scene="house" title="Pick a listing first" description="Open Stats on a listing in your dashboard." />
        </div>
      </Page>
    );
  }

  return (
    <Page width="wide">
      <PageHeader
        title="Listing analytics"
        description={analytics ? `Listing #${analytics.listing_id}` : undefined}
      />

      {isLoading ? (
        <DashboardPanelSkeleton />
      ) : error || !analytics ? (
        <InlineError title="Could not load analytics" description="Check your connection and try again." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard label="Views" value={formatCount(analytics.total_views)} />
            <StatCard
              label="Likes"
              value={formatCount(analytics.likes)}
            />
            <StatCard
              label="Chats started"
              value={formatCount(analytics.conversations_started)}
            />
          </div>

        </>
      )}
    </Page>
  );
}
