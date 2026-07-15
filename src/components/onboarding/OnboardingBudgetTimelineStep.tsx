import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import type { MoveInTimeline } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

function numberOrUndefined(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function OnboardingBudgetTimelineStep({
  budgetTimeline,
  patchDraft
}: {
  budgetTimeline: OnboardingDraft["budget_timeline"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2">Budget & Timeline</h2>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Minimum budget"
            type="number"
            placeholder="Min budget"
            value={budgetTimeline?.budget_min ? String(budgetTimeline.budget_min) : ""}
            onChange={(e) =>
              patchDraft({
                budget_timeline: {
                  ...budgetTimeline,
                  budget_min: numberOrUndefined(e.target.value)
                }
              })
            }
          />
          <Input
            label="Maximum budget"
            type="number"
            placeholder="Max budget"
            value={budgetTimeline?.budget_max ? String(budgetTimeline.budget_max) : ""}
            onChange={(e) =>
              patchDraft({
                budget_timeline: {
                  ...budgetTimeline,
                  budget_max: numberOrUndefined(e.target.value)
                }
              })
            }
          />
        </div>
        <div>
          <p className="text-label-md text-ink-2 mb-2">Move-in Timeline</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Move-in timeline">
            {(["immediate", "this_month", "next_month", "flexible"] as const).map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={budgetTimeline?.move_in_timeline === val}
                onClick={() =>
                  patchDraft({
                    budget_timeline: {
                      ...budgetTimeline,
                      move_in_timeline: val as MoveInTimeline
                    }
                  })
                }
              >
                {val === "immediate" ? "Immediately" : val === "this_month" ? "This month" : val === "next_month" ? "Next month" : "Flexible"}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
