import { Sparkles } from "lucide-react";
import { ProgressRing } from "../ui/ProgressRing";
import { cn } from "../ui/component-utils";
import { formatLifestyleLabel } from "@/lib/utils/format";
import type { SwipeProfile } from "./swipeDeck.types";
import {
  DIMENSION_ICONS,
  dimensionBarColor,
  dimensionBuckets,
  dimensionScoreText,
  matchToneLabel
} from "./swipeDeck.utils";

export function ProfileCompatibilitySection({ profile }: { profile: SwipeProfile }) {
  const dims = profile.compatibilityDimensions ?? [];
  const buckets = dimensionBuckets(dims);
  const tone = matchToneLabel(profile.matchScore);

  if (dims.length === 0) {
    if (!profile.topMatches || profile.topMatches.length === 0) return null;
    return (
      <section>
        <h3 className="text-h4 text-ink mb-2">Top matches</h3>
        <div className="flex flex-wrap gap-2">
          {profile.topMatches.map((match) => (
            <span
              key={match}
              className="rounded-full bg-success-soft px-2.5 py-1 text-caption font-semibold text-success"
            >
              {match}
            </span>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="text-h4 text-ink mb-3">Compatibility</h3>
      <div className="rounded-xl border border-line/45 bg-paper-2 p-3 space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-surface p-1 shadow-xs">
            <ProgressRing
              size="lg"
              value={profile.matchScore}
              label="Compatibility score"
            />
          </div>
          <div>
            <p
              className={cn(
                "text-body-md font-bold",
                dimensionScoreText(profile.matchScore >= 50, profile.matchScore)
              )}
            >
              {tone}
            </p>
            <p className="text-caption text-ink-3">
              {[
                buckets.aligned > 0 ? `${buckets.aligned} aligned` : null,
                buckets.workable > 0 ? `${buckets.workable} workable` : null,
                buckets.gaps > 0 ? `${buckets.gaps} gaps` : null
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <div className="h-px bg-line/45" />
        <div className="flex flex-col gap-3.5">
          {dims.map((dim) => {
            const Icon = DIMENSION_ICONS[dim.name] ?? Sparkles;
            const peerLabel = dim.peer_value
              ? formatLifestyleLabel(dim.name, dim.peer_value)
              : "—";
            const userLabel = dim.user_value
              ? formatLifestyleLabel(dim.name, dim.user_value)
              : "—";
            const glyph =
              dim.score >= 70 ? "✓" : dim.score >= 40 ? "~" : "!";
            return (
              <div key={dim.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-ink-3"
                    />
                    <span className="text-label-md font-semibold text-ink truncate">
                      {dim.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-label-md tabular-nums font-bold shrink-0",
                      dimensionScoreText(dim.match, dim.score)
                    )}
                  >
                    <span aria-hidden="true" className="mr-1">
                      {glyph}
                    </span>
                    {Math.round(dim.score)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-6">
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-caption font-semibold text-accent">
                    {peerLabel}
                  </span>
                  <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-caption text-ink-2">
                    You: {userLabel}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface ml-6">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-300",
                      dimensionBarColor(dim.match, dim.score)
                    )}
                    style={{
                      width: `${Math.min(100, Math.max(0, dim.score))}%`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
