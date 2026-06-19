import type { HTMLAttributes, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { cn } from "../ui/component-utils";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-IN");

function formatCount(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

export interface DashboardMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
  helper?: string;
}

export interface ListingPerformanceRow {
  id: string;
  title: string;
  views: number;
  likes: number;
  conversations: number;
  /** Per-listing visit count, when the API provides it. */
  visits?: number;
  boostStatus: "active" | "inactive" | "expired";
}

export interface DashboardPanelProps extends HTMLAttributes<HTMLElement> {
  metrics: DashboardMetric[];
  rows: ListingPerformanceRow[];
  /** Optional chart node. When omitted, no chart placeholder is rendered. */
  // TODO: F5 — there is no chart library in the project yet; the chart slot
  // is wired but intentionally empty. Picking + wiring a library is a larger
  // pass and needs a design call.
  chart?: ReactNode;
  onViewAnalytics?: (listingId: string) => void;
  onBoost?: (listingId: string) => void;
  onEdit?: (listingId: string) => void;
}

const boostTone: Record<ListingPerformanceRow["boostStatus"], "success" | "neutral" | "warning"> = {
  active: "success",
  inactive: "neutral",
  expired: "warning"
};

const boostLabel: Record<ListingPerformanceRow["boostStatus"], string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired"
};

export function DashboardPanel({
  metrics,
  rows,
  chart,
  onViewAnalytics,
  onBoost,
  onEdit,
  className,
  ...props
}: DashboardPanelProps) {
  const showVisits = rows.some((row) => typeof row.visits === "number");

  return (
    <section className={cn("mx-auto flex w-full max-w-[1200px] flex-col gap-5", className)} {...props}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card className="p-5" key={metric.label} variant="compact">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption text-ink-3">{metric.label}</p>
                <p className="mt-2 text-h2 font-normal tabular-nums text-ink">{metric.value}</p>
              </div>
              {metric.trend === "up" ? (
                <ArrowUpRight aria-label="Trending up" className="h-5 w-5 text-success" />
              ) : null}
              {metric.trend === "down" ? (
                <ArrowDownRight aria-label="Trending down" className="h-5 w-5 text-error" />
              ) : null}
            </div>
            {metric.helper ? <p className="mt-2 text-caption text-ink-3">{metric.helper}</p> : null}
          </Card>
        ))}
      </div>
      {chart ? <Card className="min-h-[300px]">{chart}</Card> : null}
      {/* Desktop table view */}
      <Card className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <caption className="sr-only">Performance by listing</caption>
          <thead>
            <tr className="border-b border-line text-caption uppercase tracking-[0.16em] text-ink-3">
              <th className="py-3 pr-4" scope="col">Listing</th>
              <th className="py-3 pr-4" scope="col">Views</th>
              <th className="py-3 pr-4" scope="col">Likes</th>
              <th className="py-3 pr-4" scope="col">Chats</th>
              {showVisits ? <th className="py-3 pr-4" scope="col">Visits</th> : null}
              <th className="py-3 pr-4" scope="col">Boost</th>
              <th className="py-3" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-b border-line last:border-b-0" key={row.id}>
                <th className="py-3 pr-4 text-body-md font-semibold text-ink" scope="row">{row.title}</th>
                <td className="py-3 pr-4 text-body-md tabular-nums text-ink-2">{formatCount(row.views)}</td>
                <td className="py-3 pr-4 text-body-md tabular-nums text-ink-2">{formatCount(row.likes)}</td>
                <td className="py-3 pr-4 text-body-md tabular-nums text-ink-2">{formatCount(row.conversations)}</td>
                {showVisits ? (
                  <td className="py-3 pr-4 text-body-md tabular-nums text-ink-2">
                    {typeof row.visits === "number" ? formatCount(row.visits) : "n/a"}
                  </td>
                ) : null}
                <td className="py-3 pr-4">
                  <Badge tone={boostTone[row.boostStatus]}>{boostLabel[row.boostStatus]}</Badge>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button size="compact" variant="tertiary" onClick={() => onViewAnalytics?.(row.id)}>
                      Stats
                    </Button>
                    <Button size="compact" variant="tertiary" onClick={() => onBoost?.(row.id)}>
                      Boost
                    </Button>
                    <Button size="compact" variant="tertiary" onClick={() => onEdit?.(row.id)}>
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Mobile card view */}
      <div className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => (
          <Card className="p-4" key={row.id} variant="compact">
            <div className="flex items-start justify-between gap-2">
              <h3 className="min-w-0 text-body-md font-semibold text-ink">{row.title}</h3>
              <Badge tone={boostTone[row.boostStatus]}>{boostLabel[row.boostStatus]}</Badge>
            </div>
            <div className={cn("mt-3 grid gap-2 text-center", showVisits ? "grid-cols-4" : "grid-cols-3")}>
              <div className="min-w-0">
                <p className="text-caption text-ink-3">Views</p>
                <p className="text-body-md font-semibold tabular-nums text-ink">{formatCount(row.views)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-caption text-ink-3">Likes</p>
                <p className="text-body-md font-semibold tabular-nums text-ink">{formatCount(row.likes)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-caption text-ink-3">Chats</p>
                <p className="text-body-md font-semibold tabular-nums text-ink">{formatCount(row.conversations)}</p>
              </div>
              {showVisits ? (
                <div className="min-w-0">
                  <p className="text-caption text-ink-3">Visits</p>
                  <p className="text-body-md font-semibold tabular-nums text-ink">
                    {typeof row.visits === "number" ? formatCount(row.visits) : "n/a"}
                  </p>
                </div>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="compact" variant="tertiary" onClick={() => onViewAnalytics?.(row.id)}>
                Stats
              </Button>
              <Button size="compact" variant="tertiary" onClick={() => onBoost?.(row.id)}>
                Boost
              </Button>
              <Button size="compact" variant="tertiary" onClick={() => onEdit?.(row.id)}>
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
