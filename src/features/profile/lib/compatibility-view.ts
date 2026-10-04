import { LIFESTYLE_DIMENSIONS, lifestyleOptions, type CompatibilityColor, type LifestyleDimensionKey } from "@/lib/data";
import type { CompatibilityDimension } from "@/lib/api/types";
import { formatLifestyleLabel, humanizeSnakeCase } from "@/lib/utils/format";

export const VERDICT: Record<CompatibilityColor, { label: string; tone: string }> = {
  green: { label: "Great match", tone: "text-pine" },
  amber: { label: "Workable match", tone: "text-ink-2" },
  red: { label: "Some gaps to talk about", tone: "text-clay" }
};

export function dimensionLabel(key: string): string {
  return LIFESTYLE_DIMENSIONS.find((d) => d.key === key)?.label ?? humanizeSnakeCase(key);
}

export function orderedScale(key: string): readonly { value: string; label: string }[] {
  return lifestyleOptions(key as LifestyleDimensionKey);
}

export function valueLabel(dimension: CompatibilityDimension, who: "user" | "peer"): string | null {
  const value = who === "user" ? dimension.user_value : dimension.peer_value;
  return value ? formatLifestyleLabel(dimension.name, value) : null;
}

/** The points this dimension adds to the overall score (weight × score, as in the engine). */
export function contributionFor(dimension: CompatibilityDimension): number {
  return Math.round(dimension.weight * Math.round(dimension.score));
}

export interface Opportunity {
  dimension: CompatibilityDimension;
  /** Estimated lift in overall percentage points if the user matched the peer. */
  delta: number;
}

/** The difference that costs the most points: max weight × (100 − score). */
export function findTopOpportunity(dimensions: CompatibilityDimension[]): Opportunity | null {
  let best: Opportunity | null = null;
  for (const dim of dimensions) {
    if (!dim.peer_value || dim.user_value === dim.peer_value) continue;
    const delta = dim.weight * (100 - Math.round(dim.score));
    if (!best || delta > best.delta) best = { dimension: dim, delta };
  }
  return best;
}

export function findIncompleteDimensions(dimensions: CompatibilityDimension[]): CompatibilityDimension[] {
  return dimensions.filter((d) => !d.user_value || !d.peer_value);
}
