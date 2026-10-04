import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Visit } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn, focusRing } from "@/components/ui/component-utils";
import { dayKey, groupVisitsByDay } from "@/features/visits/lib/visit-filters";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** One month of days; a day with visits shows how many. Picking a day filters the list below. */
export function VisitsCalendarView({
  visits,
  selectedDay,
  onSelectDay
}: {
  visits: Visit[];
  selectedDay: string | null;
  onSelectDay: (day: string | null) => void;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const byDay = useMemo(() => groupVisitsByDay(visits), [visits]);
  const today = dayKey(new Date());
  const label = month.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const cells = useMemo(() => {
    const lead = month.getDay();
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))
    ];
  }, [month]);

  const shift = (by: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1));

  return (
    <Card className="flex flex-col gap-3 p-3 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <Button aria-label="Previous month" size="icon" variant="icon" onClick={() => shift(-1)}>
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h2 className="text-h3 text-ink" aria-live="polite">
          {label}
        </h2>
        <Button aria-label="Next month" size="icon" variant="icon" onClick={() => shift(1)}>
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} aria-hidden="true" className="py-1 text-caption text-ink-3">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`lead-${i}`} aria-hidden="true" />;
          const key = dayKey(date);
          const count = byDay.get(key)?.length ?? 0;
          const selected = key === selectedDay;
          const isToday = key === today;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              aria-label={`${date.toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long" })}${
                count ? `, ${count} ${count === 1 ? "visit" : "visits"}` : ""
              }${isToday ? ", today" : ""}`}
              onClick={() => onSelectDay(selected ? null : key)}
              className={cn(
                "relative flex min-h-11 flex-col items-center justify-center rounded-cut-md text-body-md tabular-nums transition-colors",
                focusRing,
                selected ? "bg-clay text-on-clay" : count ? "bg-paper-1 text-ink hover:bg-paper-3" : "text-ink-2 hover:bg-surface-soft",
                isToday && !selected && "font-semibold text-clay"
              )}
            >
              {date.getDate()}
              {count ? (
                <span
                  aria-hidden="true"
                  className={cn("absolute bottom-1 h-1 w-3 rounded-full", selected ? "bg-on-clay" : "bg-clay")}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
