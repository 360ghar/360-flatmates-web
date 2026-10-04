import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useListingAnalytics, type AnalyticsPeriod } from "@/features/hosting/hooks/useDashboard";
import { Card } from "@/components/ui/Card";
import { DashboardPanelSkeleton } from "@/features/hosting/components/DashboardPanelSkeleton";
import { EmptyState, InlineError } from "@/components/ui/StateViews";
import { Page, PageHeader } from "@/components/ui/Layout";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatCard } from "@/features/hosting/components/StatCard";
import { formatDate } from "@/lib/utils/format";
import { formatCount } from "@/lib/utils/format";

const PERIOD_OPTIONS: Array<{ value: AnalyticsPeriod; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" }
];

const PERIOD_VALUES: readonly AnalyticsPeriod[] = ["7d", "30d", "all"];

function isAnalyticsPeriod(value: string | null): value is AnalyticsPeriod {
  return value !== null && (PERIOD_VALUES as readonly string[]).includes(value);
}

interface DailyStat {
  date: string;
  views: number;
  likes: number;
}

function DailyStatsTable({ dailyStats }: { dailyStats: DailyStat[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-h3 text-ink">Daily Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-body-md">
          <caption className="sr-only">Daily views and likes for the selected period</caption>
          <thead>
            <tr className="border-b border-line bg-surface-soft">
              <th className="px-4 py-2 text-left text-label-md text-ink-3" scope="col">Date</th>
              <th className="px-4 py-2 text-right text-label-md text-ink-3" scope="col">Views</th>
              <th className="px-4 py-2 text-right text-label-md text-ink-3" scope="col">Likes</th>
            </tr>
          </thead>
          <tbody>
            {dailyStats.map((row) => (
              <tr key={row.date} className="border-b border-line-2 last:border-b-0">
                <th className="px-4 py-2 text-left font-normal text-ink-2" scope="row">{formatDate(row.date)}</th>
                <td className="px-4 py-2 text-right tabular-nums text-ink">{formatCount(row.views)}</td>
                <td className="px-4 py-2 text-right tabular-nums text-ink">{formatCount(row.likes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function AnalyticsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const propertyIdRaw = searchParams.get("propertyId") ?? "0";
  const propertyId = Number(propertyIdRaw);
  const periodParam = searchParams.get("period");
  const period: AnalyticsPeriod = isAnalyticsPeriod(periodParam) ? periodParam : "30d";

  const { data: analytics, isLoading, error, refetch } = useListingAnalytics(propertyId, period);

  const handlePeriodChange = (next: string) => {
    setSearchParams(
      (params) => {
        params.set("period", next);
        return params;
      },
      { replace: true }
    );
  };

  /* Persist the default `period=30d` into the URL when the user landed here
     without one, so the URL is shareable and the segmented control stays in
     sync on re-mount. */
  useEffect(() => {
    if (!periodParam) {
      setSearchParams(
        (params) => {
          params.set("period", "30d");
          return params;
        },
        { replace: true }
      );
    }
    // We only want to write the default when the URL has no `period` at all;
    // changes to `periodParam` (via the segmented control) are handled by
    // `handlePeriodChange`. Intentionally depend on `periodParam` only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodParam]);

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
        actions={<SegmentedControl ariaLabel="Time range" options={PERIOD_OPTIONS} value={period} onValueChange={handlePeriodChange} />}
      />

      {isLoading ? (
        <DashboardPanelSkeleton />
      ) : error || !analytics ? (
        <InlineError title="Could not load analytics" description="Check your connection and try again." onRetry={() => refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard
              label="Views"
              value={formatCount(analytics.total_views)}
              description={`${formatCount(analytics.unique_views)} unique`}
            />
            <StatCard
              label="Likes"
              value={formatCount(analytics.likes)}
            />
            <StatCard
              label="Chats started"
              value={formatCount(analytics.conversations_started)}
            />
            <StatCard
              label="Visits booked"
              value={formatCount(analytics.visits_scheduled)}
            />
            <StatCard
              label="Boost"
              value={analytics.boost_active ? "Active" : "Inactive"}
              description={
                analytics.boost_active && analytics.boost_expires_at
                  ? `Expires ${formatDate(analytics.boost_expires_at)}`
                  : undefined
              }
            />
          </div>

          <div>
            {analytics.daily_stats.length > 0 ? (
              <DailyStatsTable dailyStats={analytics.daily_stats} />
            ) : (
              <Card className="flex items-center justify-center p-8">
                <EmptyState
          scene="heart"
                  title="No daily activity yet"
                  description="Day-by-day views, likes, and shares will appear here once this listing gets engagement."
                />
              </Card>
            )}
          </div>
        </>
      )}
    </Page>
  );
}
