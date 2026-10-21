import type { Visit } from "@/lib/api/types";
import { VisitCardSkeleton } from "@/features/visits/components/VisitCardSkeleton";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import { VisitCard } from "@/features/visits/components/VisitCard";
import { visitStatusToCardStatus, visitToVisitCardProps } from "@/features/visits/lib/adapters";
import type { VisitTab } from "@/features/visits/lib/visit-filters";

const EMPTY: Record<VisitTab, { title: string; description: string }> = {
  upcoming: { title: "No upcoming visits", description: "Find a place you like and ask to visit." },
  past: { title: "No past visits", description: "Visits you finish show up here." },
  cancelled: { title: "No cancelled visits", description: "Cancelled visits show up here." }
};

export function VisitsListView({
  visits,
  isLoading,
  error,
  tab,
  day,
  onRetry,
  onOpen
}: {
  visits: Visit[];
  isLoading: boolean;
  error: Error | null;
  tab: VisitTab;
  /** A picked calendar day, for the empty message. */
  day?: string | null;
  onRetry: () => void;
  onOpen: (visitId: string) => void;
}) {
  return (
    <AsyncView
      data={visits}
      isLoading={isLoading}
      error={error}
      isEmpty={(data) => data.length === 0}
      loading={
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <VisitCardSkeleton key={i} />
          ))}
        </div>
      }
      empty={
        <EmptyState
          scene="house"
          title={day ? "No visits on this day" : EMPTY[tab].title}
          description={day ? "Pick another day, or clear the day to see all." : EMPTY[tab].description}
        />
      }
      onRetry={onRetry}
    >
      {(data) => (
        <div className="flex flex-col gap-3">
          {data.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={{ ...visitToVisitCardProps(visit), status: visitStatusToCardStatus(visit.status) }}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </AsyncView>
  );
}
