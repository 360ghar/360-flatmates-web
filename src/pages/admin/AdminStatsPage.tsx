import { useAdminStats } from "@/hooks/queries";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/StateViews";
import { PageHeader } from "@/components/ui/Layout";
import { StatCard } from "@/components/molecules/StatCard";
import {
  Users,
  Building2,
  ShieldCheck,
  Heart,
  CalendarCheck,
  MessageCircle
} from "lucide-react";

export function AdminStatsPage() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
    dataUpdatedAt
  } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton variant="statCard" count={6} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Platform Stats"
        description="Key metrics for the 360 Flatmates platform."
        actions={
          dataUpdatedAt > 0 ? (
            <span
              className="text-caption text-ink-3"
              title={new Date(dataUpdatedAt).toLocaleString("en-IN")}
            >
              As of {new Date(dataUpdatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          ) : null
        }
      />

      {stats ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<Users aria-hidden="true" className="h-6 w-6" />}
            label="Total Users"
            value={stats.total_users}
          />
          <StatCard
            icon={<Building2 aria-hidden="true" className="h-6 w-6" />}
            label="Total Listings"
            value={stats.total_listings}
            href="/admin/moderation/listings"
          />
          <StatCard
            icon={<ShieldCheck aria-hidden="true" className="h-6 w-6" />}
            label="Pending Moderation"
            value={stats.pending_moderation}
            description="Listings awaiting review"
            href="/admin/moderation/listings"
          />
          <StatCard
            icon={<Heart aria-hidden="true" className="h-6 w-6" />}
            label="Total Matches"
            value={stats.total_matches}
          />
          <StatCard
            icon={<CalendarCheck aria-hidden="true" className="h-6 w-6" />}
            label="Total Visits"
            value={stats.total_visits}
          />
          <StatCard
            icon={<MessageCircle aria-hidden="true" className="h-6 w-6" />}
            label="Active Conversations"
            value={stats.active_conversations}
          />
        </div>
      ) : error ? (
        <Card className="mt-5 flex items-center justify-center p-8">
          <ErrorState
            title="Could not load platform stats"
            description="Try refreshing the page."
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
        <Card className="mt-5 flex items-center justify-center p-8">
          <EmptyState
            title="No stats available"
            description="Platform stats have not been generated yet."
            actionLabel="Reload"
            onAction={() => refetch()}
          />
        </Card>
      )}
    </div>
  );
}
