import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useListingAnalytics, type AnalyticsPeriod } from "@/hooks/queries";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState, EmptyState } from "@/components/ui/StateViews";
import { PageHeader } from "@/components/ui/Layout";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatCard } from "@/components/molecules/StatCard";
import { formatDate } from "@/lib/utils/format";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-IN");

function formatCount(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

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
        <h3 className="text-h3">Daily Breakdown</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-body-md">
          <caption className="sr-only">Daily views and likes for the selected period</caption>
          <thead>
            <tr className="border-b border-line bg-paper-2">
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
      <div className="p-4 md:p-6">
        <PageHeader title="Listing Analytics" description="View performance metrics for your listings." />
        <EmptyState
          title="No listing selected"
          description="Select a listing from your dashboard to view its analytics."
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Listing Analytics"
        description={analytics ? `Performance for listing #${analytics.listing_id}` : "Loading performance metrics."}
      />

      <div className="mt-4">
        <SegmentedControl
          ariaLabel="Select time range"
          options={PERIOD_OPTIONS}
          value={period}
          onValueChange={handlePeriodChange}
        />
      </div>

      {isLoading ? (
        <div className="mt-5">
          <Skeleton variant="dashboardPanel" />
        </div>
      ) : error || !analytics ? (
        <Card className="mt-5 flex items-center justify-center p-8">
          <ErrorState
            title="Could not load analytics"
            description="We couldn't load metrics for this listing. Retry?"
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
            <StatCard
              label="Total Views"
              value={formatCount(analytics.total_views)}
              description={`${formatCount(analytics.unique_views)} unique`}
            />
            <StatCard
              label="Likes"
              value={formatCount(analytics.likes)}
            />
            <StatCard
              label="Conversations Started"
              value={formatCount(analytics.conversations_started)}
            />
            <StatCard
              label="Visits Scheduled"
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

          <div className="mt-6">
            {analytics.daily_stats.length > 0 ? (
              <DailyStatsTable dailyStats={analytics.daily_stats} />
            ) : (
              <Card className="flex items-center justify-center p-8">
                <EmptyState
                  title="No daily activity yet"
                  description="Day-by-day views, likes, and shares will appear here once this listing gets engagement."
                />
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
