import { ChoiceField } from "@/components/ui/ChoiceChips";
import { Input } from "@/components/ui/Input";
import { MOVE_IN_TIMELINE_OPTIONS, type MoveInTimeline } from "@/lib/data";
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
      <h2 className="text-h2 text-ink">Budget and move-in</h2>
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Minimum budget"
            type="number"
            placeholder="₹ per month"
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
            placeholder="₹ per month"
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
        <ChoiceField
          legend="When do you want to move in?"
          options={MOVE_IN_TIMELINE_OPTIONS}
          value={budgetTimeline?.move_in_timeline}
          onValueChange={(move_in_timeline: MoveInTimeline) =>
            patchDraft({ budget_timeline: { ...budgetTimeline, move_in_timeline } })
          }
        />
      </div>
    </>
  );
}
