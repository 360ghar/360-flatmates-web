import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { Calendar, ChevronLeft, ChevronRight, List, Monitor } from "lucide-react";
import { useVisits } from "@/hooks/queries";
import { visitToVisitCardProps, visitStatusToCardStatus } from "@/lib/api/adapters";
import type { Visit } from "@/lib/api/types";
import { SegmentedControl, type SegmentedControlOption } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { AsyncView } from "@/components/ui/StateViews";
import { VisitCard } from "@/components/molecules/VisitCard";
import { EmptyState } from "@/components/ui/StateViews";
import { Card } from "@/components/ui/Card";
import { cn } from "@/components/ui/component-utils";

type VisitTab = "upcoming" | "past" | "cancelled";
type ViewMode = "list" | "calendar";

const TAB_OPTIONS: SegmentedControlOption[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
];

/** Build a local-tz YYYY-MM-DD key from any date-input-ish string. */
function dayKeyFromValue(value: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

/** Local-tz YYYY-MM-DD key for "today". */
function todayKey(): string {
  return dayKeyFromValue(new Date().toISOString())!;
}

function filterVisitsByTab(visits: Visit[], tab: VisitTab): Visit[] {
  const today = todayKey();
  switch (tab) {
    case "upcoming": {
      // Anything non-terminal whose scheduled date is today or in the future.
      return visits.filter((v) => {
        if (v.status === "cancelled" || v.status === "completed") return false;
        const key = dayKeyFromValue(v.scheduled_date);
        return key === null || key >= today;
      });
    }
    case "past": {
      // Completed visits, *and* any non-terminal visit whose scheduled date
      // is in the past (e.g. an unconfirmed request that the date has passed).
      return visits.filter((v) => {
        if (v.status === "cancelled") return false;
        if (v.status === "completed") return true;
        const key = dayKeyFromValue(v.scheduled_date);
        return key !== null && key < today;
      });
    }
    case "cancelled":
      return visits.filter((v) => v.status === "cancelled");
    default:
      return visits;
  }
}

/* ---------- Calendar View ---------- */

function CalendarView({
  visits,
  onDaySelect,
}: {
  visits: Visit[];
  onDaySelect?: (dateKey: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  // Build a map of local-tz date -> visit count. We convert each visit's
  // `scheduled_date` through `new Date(...)` so the bucket key matches the
  // local-tz cells built below (fixes the IST 12-hour bucket mismatch where
  // visits in `YYYY-MM-DD` form were being grouped on the *UTC* day).
  const visitsByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const visit of visits) {
      const dateStr = dayKeyFromValue(visit.scheduled_date);
      if (!dateStr) continue;
      map.set(dateStr, (map.get(dateStr) ?? 0) + 1);
    }
    return map;
  }, [visits]);

  // Build a map of local-tz date -> visits so the cell click can show a
  // list of visits on that day.
  const visitsForDay = useMemo(() => {
    const map = new Map<string, Visit[]>();
    for (const visit of visits) {
      const dateStr = dayKeyFromValue(visit.scheduled_date);
      if (!dateStr) continue;
      const bucket = map.get(dateStr) ?? [];
      bucket.push(visit);
      map.set(dateStr, bucket);
    }
    return map;
  }, [visits]);

  function goToPrevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  // Use the user's locale; fall back to en-IN (project's primary market) if
  // the runtime can't provide one. The locale governs the month name only —
  // the underlying day math remains in local time.
  const userLocale = (() => {
    if (typeof navigator === "undefined") return "en-IN";
    return navigator.language || "en-IN";
  })();

  const monthLabel = currentDate.toLocaleString(userLocale, { month: "long", year: "numeric" });

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
    } else if (e.key === "Home") {
      e.preventDefault();
      setCurrentDate(new Date());
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
          const dayVisits = cell.day !== null ? (visitsForDay.get(cell.dateStr) ?? []) : [];
          const handleClick = cell.day !== null
            ? () => onDaySelect?.(cell.dateStr)
            : undefined;
          const handleKeyDown = cell.day !== null
            ? (e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDaySelect?.(cell.dateStr);
                }
              }
            : undefined;

          return (
            <div
              key={cell.dateStr || `blank-${idx}`}
              role="gridcell"
              aria-label={cell.day !== null ? `${cell.day}, ${monthLabel}${visitCount > 0 ? `, ${visitCount} visit${visitCount > 1 ? "s" : ""}` : ""}` : undefined}
              tabIndex={cell.day !== null ? 0 : undefined}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              className={cn(
                "flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-lg border border-transparent py-2 text-body-md outline-none transition-colors",
                cell.day !== null
                  ? "text-ink hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
                  : "text-ink-4 cursor-default",
                isToday && "border-accent/30 bg-accent-soft"
              )}
            >
              {cell.day !== null ? (
                <>
                  <span className={cn(isToday && "font-bold text-accent")}>{cell.day}</span>
                  {visitCount > 0 ? (
                    <span
                      className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white"
                      aria-label={`${dayVisits.length} visit${dayVisits.length === 1 ? "" : "s"} on this day`}
                    >
                      {visitCount}
                    </span>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- List View ---------- */

function VisitsListView({
  visits,
  isLoading,
  error,
  activeTab,
  onRetry,
  onOpen,
}: {
  visits: Visit[];
  isLoading: boolean;
  error: Error | null;
  activeTab: VisitTab;
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
            <Skeleton key={i} variant="visitCard" />
          ))}
        </div>
      }
      empty={
        <EmptyState
          title={
            activeTab === "upcoming"
              ? "No upcoming visits"
              : activeTab === "past"
                ? "No past visits"
                : "No cancelled visits"
          }
          description={
            activeTab === "upcoming"
              ? "Start exploring to schedule your first visit."
              : activeTab === "past"
                ? "Your completed visits will appear here."
                : "Cancelled visits will appear here."
          }
        />
      }
      onRetry={onRetry}
    >
      {(data) => (
        <div className="flex flex-col gap-3">
          {data.map((visit) => (
            <VisitCard
              key={visit.id}
              visit={{
                ...visitToVisitCardProps(visit),
                status: visitStatusToCardStatus(visit.status),
              }}
              onConfirm={onOpen}
              onReschedule={onOpen}
              onCancel={onOpen}
              onRate={onOpen}
            />
          ))}
        </div>
      )}
    </AsyncView>
  );
}

/* ---------- Visits Page ---------- */

export function VisitsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<VisitTab>("upcoming");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { data: visitList, isLoading, error, refetch } = useVisits();
  const allVisits = useMemo(() => visitList ?? [], [visitList]);

  const filteredVisits = useMemo(
    () => filterVisitsByTab(allVisits, activeTab),
    [allVisits, activeTab]
  );

  const dayScopedVisits = useMemo(() => {
    if (!selectedDay) return filteredVisits;
    return filteredVisits.filter((v) => dayKeyFromValue(v.scheduled_date) === selectedDay);
  }, [filteredVisits, selectedDay]);

  const openVisit = useCallback((visitId: string) => navigate(`/visits/${visitId}`), [navigate]);

  return (
    <div className="flex flex-col gap-4 page-fade">
      <h1 className="text-h1">My Visits</h1>

      {/* Tab bar + view toggle */}
      <div className="flex items-center justify-between gap-3">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as VisitTab);
            setSelectedDay(null);
          }}
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

      {/* Mobile fallback banner: the calendar is a desktop-only view. */}
      {viewMode === "calendar" ? (
        <Card className="flex items-start gap-3 p-4 md:hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Monitor aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-md font-semibold text-ink">Calendar view is best on a larger screen</p>
            <p className="mt-1 text-caption text-ink-2">
              Switch to the list view below to see your visits on this device.
            </p>
            <Button
              size="compact"
              variant="secondary"
              className="mt-3"
              onClick={() => setViewMode("list")}
            >
              Switch to list view
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Selected-day chip (set by clicking a calendar cell). */}
      {selectedDay ? (
        <div className="flex items-center gap-2 text-caption text-ink-2">
          <span>
            Showing visits on <span className="font-semibold text-ink">{selectedDay}</span>
          </span>
          <Button size="compact" variant="tertiary" onClick={() => setSelectedDay(null)}>
            Clear
          </Button>
        </div>
      ) : null}

      {/* Calendar view: only visible at md+ breakpoint */}
      {viewMode === "calendar" ? (
        <div className="hidden md:block">
          <AsyncView
            data={filteredVisits}
            isLoading={isLoading}
            error={error}
            isEmpty={() => false}
            loading={
              <div className="flex flex-col gap-3">
                {/* Month navigation placeholder */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-20 rounded-lg" />
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton className="h-9 w-20 rounded-lg" />
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: 7 }, (_, i) => (
                    <Skeleton key={i} className="h-6 w-full rounded-md" />
                  ))}
                </div>
                {/* Calendar grid placeholder */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            }
            onRetry={() => refetch()}
          >
            {(data) => <CalendarView visits={data} onDaySelect={setSelectedDay} />}
          </AsyncView>
        </div>
      ) : null}

      {/* List view: shown when list mode is selected, or as mobile fallback for calendar mode */}
      {viewMode === "list" ? (
        <VisitsListView
          visits={dayScopedVisits}
          isLoading={isLoading}
          error={error}
          activeTab={activeTab}
          onRetry={() => refetch()}
          onOpen={openVisit}
        />
      ) : (
        /* Mobile fallback: show list view on small screens when calendar is selected */
        <div className="md:hidden">
          <VisitsListView
            visits={dayScopedVisits}
            isLoading={isLoading}
            error={error}
            activeTab={activeTab}
            onRetry={() => refetch()}
            onOpen={openVisit}
          />
        </div>
      )}
    </div>
  );
}
