import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useInfiniteVisits } from "@/features/visits/hooks/useVisits";
import { Button } from "@/components/ui/Button";
import { Page, PageHeader } from "@/components/ui/Layout";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/SegmentedControl";
import { VisitsCalendarView } from "@/features/visits/components/VisitsCalendarView";
import { VisitsListView } from "@/features/visits/components/VisitsListView";
import { dayKeyFromValue, filterVisitsByTab, type VisitTab } from "@/features/visits/lib/visit-filters";

type ViewMode = "list" | "calendar";

const TAB_OPTIONS: SegmentedControlOption[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" }
];

const VIEW_OPTIONS: SegmentedControlOption[] = [
  { value: "list", label: "List" },
  { value: "calendar", label: "Calendar" }
];

export function VisitsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<VisitTab>("upcoming");
  const [view, setView] = useState<ViewMode>("list");
  const [day, setDay] = useState<string | null>(null);

  // Cursor-paginated so older visits stay reachable (W14).
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteVisits();
  const all = useMemo(() => data?.pages.flatMap((page) => page.items ?? []) ?? [], [data]);
  const inTab = useMemo(() => filterVisitsByTab(all, tab), [all, tab]);
  const shown = useMemo(
    () => (view === "calendar" && day ? inTab.filter((v) => dayKeyFromValue(v.scheduled_date) === day) : inTab),
    [inTab, view, day]
  );
  const openVisit = useCallback((id: string) => navigate(`/visits/${id}`), [navigate]);

  return (
    <Page>
      <PageHeader
        title="Visits"
        actions={
          <SegmentedControl
            options={VIEW_OPTIONS}
            value={view}
            onValueChange={(v) => setView(v as ViewMode)}
            ariaLabel="View"
          />
        }
      />

      <SegmentedControl
        className="self-start"
        options={TAB_OPTIONS}
        value={tab}
        onValueChange={(v) => {
          setTab(v as VisitTab);
          setDay(null);
        }}
        ariaLabel="Visit status"
      />

      {view === "calendar" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
          <VisitsCalendarView visits={inTab} selectedDay={day} onSelectDay={setDay} />
          <VisitsListView
            visits={shown}
            isLoading={isLoading}
            error={error}
            tab={tab}
            day={day}
            onRetry={() => refetch()}
            onOpen={openVisit}
          />
        </div>
      ) : (
        <VisitsListView visits={shown} isLoading={isLoading} error={error} tab={tab} onRetry={() => refetch()} onOpen={openVisit} />
      )}

      {hasNextPage ? (
        <Button variant="secondary" className="self-center" loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>
          Load more visits
        </Button>
      ) : null}
    </Page>
  );
}
