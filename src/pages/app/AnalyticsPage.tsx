import { useSearchParams } from "react-router";
import { useListingAnalytics } from "@/hooks/queries";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { PageHeader } from "@/components/ui/Layout";
import { StatCard } from "@/components/molecules/StatCard";

function DailyStatsTable({ dailyStats }: { dailyStats: Array<{ date: string; views: number; likes: number; shares: number }> }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-h3">Daily Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-body-md">
          <thead>
            <tr className="border-b border-line bg-paper-2">
              <th className="px-4 py-2 text-left text-label-md text-ink-3">Date</th>
              <th className="px-4 py-2 text-right text-label-md text-ink-3">Views</th>
              <th className="px-4 py-2 text-right text-label-md text-ink-3">Likes</th>
              <th className="px-4 py-2 text-right text-label-md text-ink-3">Shares</th>
            </tr>
          </thead>
          <tbody>
            {dailyStats.map((row) => (
              <tr key={row.date} className="border-b border-line-2 last:border-b-0">
                <td className="px-4 py-2 text-ink-2">{row.date}</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">{row.views}</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">{row.likes}</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">{row.shares}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function AnalyticsPage() {
  const [searchParams] = useSearchParams();
  const propertyId = Number(searchParams.get("propertyId") ?? "0");

  const { data: analytics, isLoading, error, refetch } = useListingAnalytics(propertyId);

  if (!propertyId || Number.isNaN(propertyId) || propertyId === 0) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title="Listing Analytics" description="View performance metrics for your listings." />
        <EmptyState
          title="No listing selected"
          description="Select a listing from your dashboard to view its analytics."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 p-4 md:p-6">
        {/* Title */}
        <div className="h-7 w-44 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
        {/* StatCard grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} variant="statCard" />
          ))}
        </div>
        {/* Table skeleton */}
        <div className="rounded-2xl border border-line bg-surface p-0 shadow-sm overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <div className="h-5 w-32 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
          </div>
          <div className="border-b border-line bg-paper-2 px-4 py-2 flex gap-4">
            <div className="h-3 w-12 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
            <div className="h-3 w-10 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
            <div className="h-3 w-10 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
            <div className="h-3 w-10 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="border-b border-line-2 last:border-b-0 px-4 py-2 flex gap-4">
              <div className="h-4 w-16 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
              <div className="h-4 w-8 rounded-sm shimmer animate-shimmer motion-reduce:animate-none ml-auto" />
              <div className="h-4 w-8 rounded-sm shimmer animate-shimmer motion-reduce:animate-none ml-auto" />
              <div className="h-4 w-8 rounded-sm shimmer animate-shimmer motion-reduce:animate-none ml-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState
          title="Could not load analytics"
          description="Try refreshing the page."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Listing Analytics" description={`Performance for listing #${analytics.listing_id}`} />

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Views"
          value={analytics.total_views}
          description={`${analytics.unique_views} unique`}
        />
        <StatCard
          label="Likes"
          value={analytics.likes}
        />
        <StatCard
          label="Shares"
          value={analytics.shares}
        />
        <StatCard
          label="Conversations Started"
          value={analytics.conversations_started}
        />
        <StatCard
          label="Visits Scheduled"
          value={analytics.visits_scheduled}
        />
        <StatCard
          label="Boost"
          value={analytics.boost_active ? "Active" : "Inactive"}
          description={analytics.boost_expires_at ? `Expires ${analytics.boost_expires_at}` : undefined}
        />
      </div>

      {analytics.daily_stats.length > 0 && (
        <div className="mt-6">
          <DailyStatsTable dailyStats={analytics.daily_stats} />
        </div>
      )}
    </div>
  );
}
