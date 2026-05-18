import { useAdminStats } from "@/hooks/queries";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/StateViews";
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
  const { data: stats, isLoading, error, refetch } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton variant="block" count={6} className="h-28" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <ErrorState
          title="Could not load platform stats"
          description="Try refreshing the page."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Platform Stats" description="Key metrics for the 360 Flatmates platform." />

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
        />
        <StatCard
          icon={<ShieldCheck aria-hidden="true" className="h-6 w-6" />}
          label="Pending Moderation"
          value={stats.pending_moderation}
          description="Listings awaiting review"
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
    </div>
  );
}
