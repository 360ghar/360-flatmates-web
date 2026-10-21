import { ChoiceField } from "@/components/ui/ChoiceChips";
import { lifestyleOptions, type Cleanliness, type FoodHabits, type SleepSchedule } from "@/lib/data";
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
      <h2 className="text-h2 text-ink">Your day-to-day</h2>
      <div className="flex flex-col gap-6">
        <ChoiceField
          legend="When do you sleep?"
          options={lifestyleOptions("sleep_schedule") as ReadonlyArray<{ value: SleepSchedule; label: string }>}
          value={lifestyle?.sleep_schedule}
          onValueChange={(sleep_schedule) => patchDraft({ lifestyle: { ...lifestyle, sleep_schedule } })}
        />
        <ChoiceField
          legend="How tidy is your space?"
          options={lifestyleOptions("cleanliness") as ReadonlyArray<{ value: Cleanliness; label: string }>}
          value={lifestyle?.cleanliness}
          onValueChange={(cleanliness) => patchDraft({ lifestyle: { ...lifestyle, cleanliness } })}
        />
        <ChoiceField
          legend="What do you eat?"
          options={lifestyleOptions("food_habits") as ReadonlyArray<{ value: FoodHabits; label: string }>}
          value={lifestyle?.food_habits}
          onValueChange={(food_habits) => patchDraft({ lifestyle: { ...lifestyle, food_habits } })}
        />
      </div>
    </>
  );
}
