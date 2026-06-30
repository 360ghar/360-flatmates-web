import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ChevronRight, Lightbulb, Sparkles, AlertCircle } from "lucide-react";
import { useCompatibility } from "@/hooks/queries";
import { LIFESTYLE_DIMENSIONS } from "@/lib/data";
import { humanizeSnakeCase, formatLifestyleLabel } from "@/lib/utils";
import type { CompatibilityColor } from "@/lib/data";
import type { CompatibilityDimension } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Modal } from "@/components/ui/Modal";
import { AsyncView, ErrorState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/components/ui/component-utils";

const COLOR_TONE: Record<CompatibilityColor, "success" | "warning" | "error"> = {
  green: "success",
  amber: "warning",
  red: "error"
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

function getOrderedScale(key: string): readonly { value: string; label: string }[] {
  const definition = LIFESTYLE_DIMENSIONS.find((d) => d.key === key);
  return definition?.options ?? [];
}

function scoreFor(dimension: CompatibilityDimension): number {
  return Math.round(dimension.score);
}

function contributionFor(dimension: CompatibilityDimension): number {
  // The dimension contributes `weight * score` to the overall percentage
  // (per the engine in `lib/compatibility/engine.ts`). We surface this so
  // users can see *why* the overall moves when one dimension changes.
  return Math.round(dimension.weight * scoreFor(dimension));
}

function DimensionRow({
  dimension,
  onOpen,
}: {
  dimension: CompatibilityDimension;
  onOpen: (dim: CompatibilityDimension) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(dimension)}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-lg p-2 -mx-2 text-left outline-none",
        "hover:bg-paper-2 focus-visible:bg-paper-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1"
      )}
      aria-label={`Open details for ${getDimensionLabel(dimension.name)}`}
    >
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
          <ChevronRight aria-hidden="true" className="h-4 w-4 text-ink-3" />
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
    </button>
  );
}

function DimensionDetailModal({
  dimension,
  open,
  onClose,
}: {
  dimension: CompatibilityDimension | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!dimension) return null;
  const ordered = getOrderedScale(dimension.name);
  const userIdx = dimension.user_value ? ordered.findIndex((o) => o.value === dimension.user_value) : -1;
  const peerIdx = dimension.peer_value ? ordered.findIndex((o) => o.value === dimension.peer_value) : -1;
  const distance = userIdx >= 0 && peerIdx >= 0 ? Math.abs(userIdx - peerIdx) : null;
  const score = scoreFor(dimension);
  const contribution = contributionFor(dimension);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={getDimensionLabel(dimension.name)}
      description={
        dimension.match
          ? "You and this person are aligned here."
          : "This is an area where you differ. Tap a profile to update it."
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between rounded-xl bg-paper-2 p-3">
          <div>
            <p className="text-caption text-ink-3">Dimension score</p>
            <p className="text-h2 font-semibold text-ink">{score}%</p>
          </div>
          <div className="text-right">
            <p className="text-caption text-ink-3">Contribution to overall</p>
            <p className="text-h3 font-semibold text-ink">+{contribution} pts</p>
            <p className="text-caption text-ink-3">weight {Math.round(dimension.weight * 100)}%</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-label-md text-ink-2">Ordered scale</p>
          <div className="flex flex-col gap-1.5">
            {ordered.map((option, idx) => {
              const isYou = idx === userIdx;
              const isPeer = idx === peerIdx;
              return (
                <div
                  key={option.value}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-3 py-2 text-body-md",
                    isYou ? "border-accent bg-accent-soft text-ink" : "border-line bg-surface text-ink-2",
                    isPeer && !isYou && "border-info/40"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{option.label}</span>
                    {isYou ? (
                      <Badge tone="accent" className="ml-1">You</Badge>
                    ) : null}
                    {isPeer && !isYou ? (
                      <Badge tone="info" className="ml-1">Them</Badge>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md bg-paper-2 p-3">
            <p className="text-caption text-ink-3">Your value</p>
            <p className="text-body-md font-semibold text-ink">
              {dimension.user_value ? formatLifestyleLabel(dimension.name, dimension.user_value) : "—"}
            </p>
          </div>
          <div className="rounded-md bg-paper-2 p-3">
            <p className="text-caption text-ink-3">Their value</p>
            <p className="text-body-md font-semibold text-ink">
              {dimension.peer_value ? formatLifestyleLabel(dimension.name, dimension.peer_value) : "—"}
            </p>
          </div>
        </div>

        {distance !== null ? (
          <p className="text-caption text-ink-3">
            {distance === 0
              ? "Exact match on this dimension."
              : `${distance} step${distance === 1 ? "" : "s"} apart on the scale.`}
          </p>
        ) : (
          <p className="text-caption text-ink-3">
            One of you hasn't filled this in yet — it doesn't count against your score.
          </p>
        )}
      </div>
    </Modal>
  );
}

interface Opportunity {
  dimension: CompatibilityDimension;
  /** Score if the user shifted their value to match the peer (capped at 100). */
  improvedScore: number;
  /** Estimated lift in overall percentage points. */
  delta: number;
}

function findTopOpportunity(dimensions: CompatibilityDimension[]): Opportunity | null {
  // Maximise `weight * (100 - score)`. We don't know what the user's new
  // value would be, so we estimate the best case: align to peer for 100%.
  let best: Opportunity | null = null;
  for (const dim of dimensions) {
    if (dim.user_value && dim.peer_value && dim.user_value === dim.peer_value) continue;
    if (!dim.peer_value) continue;
    const improvedScore = 100;
    const currentContribution = dim.weight * scoreFor(dim);
    const improvedContribution = dim.weight * improvedScore;
    const delta = improvedContribution - currentContribution;
    if (!best || delta > best.delta) {
      best = { dimension: dim, improvedScore, delta };
    }
  }
  return best;
}

function findIncompleteDimensions(dimensions: CompatibilityDimension[]): CompatibilityDimension[] {
  return dimensions.filter((d) => !d.user_value || !d.peer_value);
}

export function CompatibilityPage() {
  const { id } = useParams<{ id: string }>();
  const peerId = Number(id);
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useCompatibility(peerId);
  const [openDim, setOpenDim] = useState<CompatibilityDimension | null>(null);

  // Defensive: the URL param may be a non-numeric string (NaN), 0, or
  // negative. `useCompatibility` only fires for `peerId > 0`, so anything
  // else would leave the page stuck in the "incompatible" empty state.
  // Redirect to /home rather than render a broken page.
  if (!Number.isInteger(peerId) || peerId <= 0) {
    navigate("/home", { replace: true });
    return null;
  }

  const opportunity = data ? findTopOpportunity(data.dimensions) : null;
  const incomplete = data ? findIncompleteDimensions(data.dimensions) : [];

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="icon"
          size="icon"
          aria-label="Go back"
          onClick={() => navigate(-1)}
        >
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
            <Card className="flex flex-col items-center gap-4 p-6 text-center">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-48 rounded-full" />
            </Card>
            <Card className="flex flex-col gap-4 p-5">
              <Skeleton className="h-5 w-24 rounded-full" />
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </Card>
            <Card className="flex flex-col gap-3 p-5">
              <Skeleton className="h-5 w-20 rounded-full" />
              {Array.from({ length: 2 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-full rounded-full" />
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
                <Badge tone={COLOR_TONE[breakdown.color]}>
                  {COLOR_LABEL[breakdown.color]}
                </Badge>
              </div>
              <p className="text-body-md text-ink-2 max-w-sm">
                {breakdown.overall_percentage}% overall compatibility based on
                lifestyle preferences
              </p>
            </Card>

            <Card className="flex flex-col gap-3 p-5">
              <h2 className="text-h3">Summary</h2>
              <ul className="flex flex-col gap-2">
                {(breakdown.summary.length > 0
                  ? breakdown.summary
                  : [
                      `${breakdown.overall_percentage}% compatibility based on the lifestyle details both profiles have shared.`,
                    ]
                ).map((line) => (
                  <li key={line} className="flex items-start gap-2 text-body-md text-ink-2">
                    <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Top opportunity */}
            {opportunity ? (
              <Card className="flex flex-col gap-2 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Sparkles aria-hidden="true" className="h-4 w-4" />
                  </div>
                  <h2 className="text-h3">Top opportunity</h2>
                </div>
                <p className="text-body-md text-ink-2">
                  Aligning on <span className="font-semibold text-ink">{getDimensionLabel(opportunity.dimension.name)}</span>{" "}
                  (currently {opportunity.dimension.score}%) could raise your
                  overall by about <span className="font-semibold text-accent">+{opportunity.delta} pts</span>{" "}
                  to roughly {Math.min(100, breakdown.overall_percentage + Math.round(opportunity.delta))}%.
                </p>
                <p className="text-caption text-ink-3">
                  You're on "{opportunity.dimension.user_value ? formatLifestyleLabel(opportunity.dimension.name, opportunity.dimension.user_value) : "—"}" — they're on "{opportunity.dimension.peer_value ? formatLifestyleLabel(opportunity.dimension.name, opportunity.dimension.peer_value) : "—"}".
                </p>
              </Card>
            ) : null}

            {/* Dimension breakdown */}
            <Card className="flex flex-col gap-4 p-5">
              <h2 className="text-h3">Breakdown</h2>
              {breakdown.dimensions.map((dim) => (
                <DimensionRow
                  key={dim.name}
                  dimension={dim}
                  onOpen={(d) => setOpenDim(d)}
                />
              ))}
            </Card>

            {/* What we couldn't compare */}
            {incomplete.length > 0 ? (
              <Card className="flex flex-col gap-2 p-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning-soft text-warning">
                    <AlertCircle aria-hidden="true" className="h-4 w-4" />
                  </div>
                  <h2 className="text-h3">What we couldn't compare</h2>
                </div>
                <p className="text-caption text-ink-2">
                  These dimensions can't be scored until both profiles are complete.
                </p>
                <ul className="flex flex-col gap-1">
                  {incomplete.map((dim) => (
                    <li key={dim.name} className="flex items-center gap-2 text-body-md text-ink-2">
                      <span aria-hidden="true">•</span>
                      <span className="font-medium text-ink">{getDimensionLabel(dim.name)}</span>
                      <span className="text-ink-3">
                        ({!dim.user_value ? "you" : "them"} hasn't set this)
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="compact" variant="secondary" onClick={() => navigate("/profile/edit")}>
                    <Lightbulb aria-hidden="true" className="h-4 w-4" />
                    Update my profile
                  </Button>
                </div>
              </Card>
            ) : null}

            <DimensionDetailModal
              open={openDim !== null}
              dimension={openDim}
              onClose={() => setOpenDim(null)}
            />
          </>
        )}
      </AsyncView>
    </div>
  );
}
