import { ChevronRight } from "lucide-react";
import type { CompatibilityDimension } from "@/lib/api/types";
import { cn, focusRing } from "@/components/ui/component-utils";
import { dimensionLabel, valueLabel } from "@/features/profile/lib/compatibility-view";

function barTone(dimension: CompatibilityDimension): string {
  if (dimension.match) return "bg-pine";
  return dimension.score >= 40 ? "bg-marigold" : "bg-clay";
}

/** One part of daily life: both answers, the score and a bar. Opens the detail. */
export function DimensionRow({
  dimension,
  onOpen
}: {
  dimension: CompatibilityDimension;
  onOpen: (dimension: CompatibilityDimension) => void;
}) {
  const label = dimensionLabel(dimension.name);
  return (
    <button
      type="button"
      onClick={() => onOpen(dimension)}
      className={cn("-mx-3 flex w-[calc(100%+24px)] flex-col gap-2 rounded-cut-md p-3 text-left hover:bg-surface-soft", focusRing)}
    >
      <span className="flex w-full items-center gap-3">
        <span className="min-w-0 flex-1 text-body-md font-semibold text-ink">{label}</span>
        <span className="tabular text-label-md text-ink">{Math.round(dimension.score)}%</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-3" />
      </span>
      <span aria-hidden="true" className="block h-2 w-full overflow-hidden rounded-full bg-surface-soft">
        <span className={cn("block h-full rounded-full", barTone(dimension))} style={{ width: `${dimension.score}%` }} />
      </span>
      <span className="text-caption text-ink-2">
        You: {valueLabel(dimension, "user") ?? "not set"} · Them: {valueLabel(dimension, "peer") ?? "not set"}
      </span>
    </button>
  );
}
