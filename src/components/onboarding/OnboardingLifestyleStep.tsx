import { Chip } from "@/components/ui/Chip";
import type { Cleanliness, FoodHabits, SleepSchedule } from "@/lib/data";
import { humanizeSnakeCase } from "@/lib/utils";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingLifestyleStep({
  lifestyle,
  patchDraft
}: {
  lifestyle: OnboardingDraft["lifestyle"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2">Your lifestyle</h2>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-label-md text-ink-2 mb-2">Sleep Schedule</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Sleep schedule">
            {(["early_bird", "flexible", "night_owl"] as const).map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={lifestyle?.sleep_schedule === val}
                onClick={() =>
                  patchDraft({ lifestyle: { ...lifestyle, sleep_schedule: val as SleepSchedule } })
                }
              >
                {humanizeSnakeCase(val)}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-label-md text-ink-2 mb-2">Cleanliness</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cleanliness">
            {(["minimal", "tidy", "spotless"] as const).map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={lifestyle?.cleanliness === val}
                onClick={() =>
                  patchDraft({ lifestyle: { ...lifestyle, cleanliness: val as Cleanliness } })
                }
              >
                {val}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-label-md text-ink-2 mb-2">Food Habits</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Food habits">
            {(["vegetarian", "vegan", "non_vegetarian", "eggetarian", "no_preference"] as const).map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={lifestyle?.food_habits === val}
                onClick={() =>
                  patchDraft({ lifestyle: { ...lifestyle, food_habits: val as FoodHabits } })
                }
              >
                {humanizeSnakeCase(val)}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
