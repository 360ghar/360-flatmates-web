import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useCompatibility } from "@/hooks/queries";
import { LIFESTYLE_DIMENSIONS } from "@/lib/data";
import { humanizeSnakeCase, formatLifestyleLabel } from "@/lib/utils";
import type { CompatibilityColor, CompatibilityDimension } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { AsyncView, ErrorState } from "@/components/ui/StateViews";

const COLOR_TONE: Record<CompatibilityColor, "success" | "warning" | "error"> = {
  green: "success",
  amber: "warning",
  red: "error"
};

const COLOR_STATUS: Record<CompatibilityColor, "confirmed" | "pending" | "rejected"> = {
  green: "confirmed",
  amber: "pending",
  red: "rejected"
};

const COLOR_LABEL: Record<CompatibilityColor, string> = {
  green: "Great Match",
  amber: "Workable Match",
  red: "Preference Gap"
};

const SCORE_BAR_COLOR: Record<"match" | "partial" | "mismatch", string> = {
  match: "bg-success",
  partial: "bg-warning",
  mismatch: "bg-error",
};

function dimensionBarColor(match: boolean, score: number): "match" | "partial" | "mismatch" {
  if (match) return "match";
  if (score >= 40) return "partial";
  return "mismatch";
}

function getDimensionLabel(key: string): string {
  const definition = LIFESTYLE_DIMENSIONS.find((d) => d.key === key);
  return definition?.label ?? humanizeSnakeCase(key);
}

function DimensionRow({ dimension }: { dimension: CompatibilityDimension }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-body-md text-ink">{getDimensionLabel(dimension.name)}</span>
        <div className="flex items-center gap-2">
          <span className="text-label-md text-ink-2">
            {dimension.user_value ? formatLifestyleLabel(dimension.name, dimension.user_value) : "--"}
          </span>
          <span className="text-ink-3">vs</span>
          <span className="text-label-md text-ink-2">
            {dimension.peer_value ? formatLifestyleLabel(dimension.name, dimension.peer_value) : "--"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-paper-2">
          <div
            className={`h-full rounded-full transition-all duration-300 ${SCORE_BAR_COLOR[dimensionBarColor(dimension.match, dimension.score)]}`}
            style={{ width: `${dimension.score}%` }}
          />
        </div>
        <span className="text-label-md tabular-nums text-ink w-10 text-right">
          {dimension.score}%
        </span>
      </div>
    </div>
  );
}

export function CompatibilityPage() {
  const { id } = useParams<{ id: string }>();
  const peerId = Number(id);
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useCompatibility(peerId);

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="icon" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </Button>
        <h1 className="text-h1">Compatibility</h1>
      </div>

      <AsyncView
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        loading={
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[9px] shimmer animate-shimmer motion-reduce:animate-none" />
              <div className="h-7 w-32 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
            </div>
            <Card className="flex flex-col items-center gap-4 p-6 text-center">
              <div className="h-28 w-28 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
              <div className="h-5 w-24 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
              <div className="h-4 w-48 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
            </Card>
            <Card className="flex flex-col gap-4 p-5">
              <div className="h-5 w-24 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="h-4 w-32 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
                  <div className="h-2 w-full rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
                </div>
              ))}
            </Card>
            <Card className="flex flex-col gap-3 p-5">
              <div className="h-5 w-20 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="h-4 w-full rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
              ))}
            </Card>
          </div>
        }
        empty={
          <ErrorState
            title="No compatibility data"
            description="Could not compute compatibility with this user."
            onRetry={() => refetch()}
          />
        }
      >
        {(breakdown) => (
          <>
            {/* Overall score */}
            <Card className="flex flex-col items-center gap-4 p-6 text-center">
              <ProgressRing
                size="xl"
                value={breakdown.overall_percentage}
                label="Overall compatibility"
              />
              <div>
                <Badge
                  tone={COLOR_TONE[breakdown.color]}
                  status={COLOR_STATUS[breakdown.color]}
                >
                  {COLOR_LABEL[breakdown.color]}
                </Badge>
              </div>
              <p className="text-body-md text-ink-2 max-w-sm">
                {breakdown.overall_percentage}% overall compatibility based on
                lifestyle preferences
              </p>
            </Card>

            {/* Dimension breakdown */}
            <Card className="flex flex-col gap-4 p-5">
              <h2 className="text-h3">Breakdown</h2>
              {breakdown.dimensions.map((dim) => (
                <DimensionRow key={dim.name} dimension={dim} />
              ))}
            </Card>

            {/* Summary */}
            {breakdown.summary.length > 0 && (
              <Card className="flex flex-col gap-3 p-5">
                <h2 className="text-h3">Summary</h2>
                <ul className="flex flex-col gap-2">
                  {breakdown.summary.map((line, index) => (
                    <li key={index} className="text-body-md text-ink-2">
                      {line}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}
      </AsyncView>
    </div>
  );
}
