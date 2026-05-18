import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { Calendar, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useVisits } from "@/hooks/queries";
import { visitToVisitCardProps } from "@/lib/api/adapters";
import type { Visit } from "@/lib/api/types";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { VisitCard } from "@/components/molecules/VisitCard";
import { EmptyState } from "@/components/ui/StateViews";
import { cn } from "@/components/ui/component-utils";

type VisitTab = "upcoming" | "past" | "cancelled";
type ViewMode = "list" | "calendar";

const TAB_OPTIONS: SegmentedControlOption[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

function filterVisitsByTab(visits: Visit[], tab: VisitTab): Visit[] {
  switch (tab) {
    case "upcoming":
      return visits.filter(
        (v) => v.status === "requested" || v.status === "confirmed" || v.status === "reschedule_suggested"
      );
    case "past":
      return visits.filter((v) => v.status === "completed");
    case "cancelled":
      return visits.filter((v) => v.status === "cancelled");
    default:
      return visits;
  }
}

/* ---------- Calendar View ---------- */

function CalendarView({ visits }: { visits: Visit[] }) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  // Build a map of date -> visit count
  const visitsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const visit of visits) {
      const dateStr = visit.scheduled_date.split("T")[0]; // "YYYY-MM-DD"
      map.set(dateStr, (map.get(dateStr) ?? 0) + 1);
    }
    return map;
  }, [visits]);

  function goToPrevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  const monthLabel = currentDate.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const { cells, todayStr } = useMemo(() => {
    const today = new Date();
    const tStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const c: Array<{ day: number | null; dateStr: string }> = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      c.push({ day: null, dateStr: "" });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      c.push({ day: d, dateStr });
    }
    const remaining = 7 - (c.length % 7);
    if (remaining < 7) {
      for (let i = 0; i < remaining; i++) {
        c.push({ day: null, dateStr: "" });
      }
    }
    return { cells: c, todayStr: tStr };
  }, [year, month, startDayOfWeek, daysInMonth]);

  function handleCalendarKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goToPrevMonth();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goToNextMonth();
    }
  }

  return (
    <div className="flex flex-col gap-3" role="grid" aria-label="Visit calendar" onKeyDown={handleCalendarKeyDown}>
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="compact" onClick={goToPrevMonth} leadingIcon={<ChevronLeft aria-hidden="true" className="h-4 w-4" />}>
          Prev
        </Button>
        <span className="text-body-md font-semibold tabular-nums text-ink" aria-live="polite">{monthLabel}</span>
        <Button variant="secondary" size="compact" onClick={goToNextMonth} trailingIcon={<ChevronRight aria-hidden="true" className="h-4 w-4" />}>
          Next
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 text-center" role="row">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-2 text-caption font-semibold text-ink-3" role="columnheader">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          const visitCount = cell.day !== null ? (visitsByDay.get(cell.dateStr) ?? 0) : 0;
          const isToday = cell.dateStr === todayStr;

          return (
            <div
              key={idx}
              role="gridcell"
              aria-label={cell.day !== null ? `${cell.day}, ${monthLabel}${visitCount > 0 ? `, ${visitCount} visit${visitCount > 1 ? "s" : ""}` : ""}` : undefined}
              tabIndex={cell.day !== null ? 0 : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center rounded-lg border border-transparent py-2 text-body-md",
                cell.day !== null ? "text-ink hover:bg-paper-2 focus-visible:bg-paper-2" : "text-ink-4",
                isToday && "border-accent/30 bg-accent-soft",
                cell.day !== null && "hover:bg-paper-2"
              )}
            >
              {cell.day !== null ? (
                <>
                  <span className={cn(isToday && "font-bold text-accent")}>{cell.day}</span>
                  {visitCount > 0 && (
                    <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
                      {visitCount}
                    </span>
                  )}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Visits Page ---------- */

export function VisitsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<VisitTab>("upcoming");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const { data: visitList, isLoading, error, refetch } = useVisits();
  const filteredVisits = useMemo(
    () => filterVisitsByTab(visitList?.visits ?? [], activeTab),
    [visitList?.visits, activeTab]
  );

  return (
    <div className="flex flex-col gap-4 page-fade">
      <h1 className="text-h1">My Visits</h1>

      {/* Tab bar + view toggle */}
      <div className="flex items-center justify-between gap-3">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as VisitTab)}
          ariaLabel="Visit status filter"
        />
        <div className="flex gap-1 rounded-full bg-paper-2 p-1">
          <Button
            aria-label="List view"
            size="icon"
            variant="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              viewMode === "list" ? "bg-surface text-ink shadow-xs" : "text-ink-3"
            )}
            onClick={() => setViewMode("list")}
          >
            <List aria-hidden="true" className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Calendar view"
            size="icon"
            variant="icon"
            className={cn(
              "h-8 w-8 rounded-full",
              viewMode === "calendar" ? "bg-surface text-ink shadow-xs" : "text-ink-3"
            )}
            onClick={() => setViewMode("calendar")}
          >
            <Calendar aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar view: only visible at md+ breakpoint */}
      {viewMode === "calendar" ? (
        <div className="hidden md:block">
          <CalendarView visits={filteredVisits} />
        </div>
      ) : null}

      {/* List view: shown when list mode is selected, or as mobile fallback for calendar mode */}
      {viewMode === "list" ? (
        <AsyncView
          data={filteredVisits}
          isLoading={isLoading}
          error={error}
          isEmpty={(data) => data.length === 0}
          loading={
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="visitCard" />)}
              </div>
            }
          empty={
            <EmptyState
              title={
                activeTab === "upcoming" ? "No upcoming visits" :
                activeTab === "past" ? "No past visits" : "No cancelled visits"
              }
              description={
                activeTab === "upcoming" ? "Start exploring to schedule your first visit!"
                : activeTab === "past" ? "Your completed visits will appear here."
                : "Cancelled visits will appear here."
              }
            />
          }
          onRetry={() => refetch()}
        >
          {(data) => (
            <div className="flex flex-col gap-3">
              {data.map((visit) => (
                <VisitCard
                  key={visit.id}
                  visit={visitToVisitCardProps(visit)}
                  canConfirm={visit.status === "requested"}
                  onConfirm={(visitId) => navigate(`/visits/${visitId}`)}
                  onReschedule={(visitId) => navigate(`/visits/${visitId}`)}
                  onCancel={(visitId) => navigate(`/visits/${visitId}`)}
                  onRate={(visitId) => navigate(`/visits/${visitId}`)}
                />
              ))}
            </div>
          )}
        </AsyncView>
      ) : (
        /* Mobile fallback: show list view on small screens when calendar is selected */
        <div className="md:hidden">
          <AsyncView
            data={filteredVisits}
            isLoading={isLoading}
            error={error}
            isEmpty={(data) => data.length === 0}
            loading={
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="visitCard" />)}
              </div>
            }
            empty={
              <EmptyState
                title={
                  activeTab === "upcoming" ? "No upcoming visits" :
                  activeTab === "past" ? "No past visits" : "No cancelled visits"
                }
                description={
                  activeTab === "upcoming" ? "Start exploring to schedule your first visit!"
                  : activeTab === "past" ? "Your completed visits will appear here."
                  : "Cancelled visits will appear here."
                }
              />
            }
            onRetry={() => refetch()}
          >
            {(data) => (
              <div className="flex flex-col gap-3">
                {data.map((visit) => (
                  <VisitCard
                    key={visit.id}
                    visit={visitToVisitCardProps(visit)}
                    canConfirm={visit.status === "requested"}
                    onConfirm={(visitId) => navigate(`/visits/${visitId}`)}
                    onReschedule={(visitId) => navigate(`/visits/${visitId}`)}
                    onCancel={(visitId) => navigate(`/visits/${visitId}`)}
                    onRate={(visitId) => navigate(`/visits/${visitId}`)}
                  />
                ))}
              </div>
            )}
          </AsyncView>
        </div>
      )}
    </div>
  );
}
