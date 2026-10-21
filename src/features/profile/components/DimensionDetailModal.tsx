import type { CompatibilityDimension } from "@/lib/api/types";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/components/ui/component-utils";
import { contributionFor, dimensionLabel, orderedScale, valueLabel } from "@/features/profile/lib/compatibility-view";

/** Where you and they sit on one scale, and what it adds to the overall score. */
export function DimensionDetailModal({
  dimension,
  onClose
}: {
  dimension: CompatibilityDimension | null;
  onClose: () => void;
}) {
  if (!dimension) return null;
  const scale = orderedScale(dimension.name);
  const userIdx = scale.findIndex((o) => o.value === dimension.user_value);
  const peerIdx = scale.findIndex((o) => o.value === dimension.peer_value);
  const distance = userIdx >= 0 && peerIdx >= 0 ? Math.abs(userIdx - peerIdx) : null;

  return (
    <Modal
      open
      onClose={onClose}
      title={dimensionLabel(dimension.name)}
      description={dimension.match ? "You and this person agree here." : "You differ here. It is worth a chat."}
    >
      <div className="flex flex-col gap-5">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-caption text-ink-3">Score</dt>
            <dd className="tabular text-h2 text-ink">{Math.round(dimension.score)}%</dd>
          </div>
          <div>
            <dt className="text-caption text-ink-3">Adds to overall</dt>
            <dd className="tabular text-h2 text-ink">+{contributionFor(dimension)}</dd>
            <dd className="text-caption text-ink-3">Weight {Math.round(dimension.weight * 100)}%</dd>
          </div>
        </dl>

        {scale.length ? (
          <ol aria-label="The scale, in order" className="flex flex-col gap-1.5">
            {scale.map((option, idx) => {
              const who = [idx === userIdx && "You", idx === peerIdx && "Them"].filter(Boolean).join(" and ");
              return (
                <li
                  key={option.value}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-3 rounded-cut-md px-3 py-2 text-body-md",
                    who ? "paper-grain bg-paper-3 text-ink shadow-xs" : "text-ink-2"
                  )}
                >
                  <span className={cn(who && "font-semibold")}>{option.label}</span>
                  {who ? <span className="text-label-md text-ink-2">{who}</span> : null}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-body-md text-ink-2">
            You: {valueLabel(dimension, "user") ?? "not set"}. Them: {valueLabel(dimension, "peer") ?? "not set"}.
          </p>
        )}

        <p className="text-caption text-ink-3">
          {distance === null
            ? "One of you has not answered this yet, so it does not count against the score."
            : distance === 0
              ? "The same answer."
              : `${distance} ${distance === 1 ? "step" : "steps"} apart on the scale.`}
        </p>
      </div>
    </Modal>
  );
}
