import { ChoiceField } from "@/components/ui/ChoiceChips";
import type { GenderPreference } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

const GENDER_OPTIONS: ReadonlyArray<{ value: GenderPreference; label: string }> = [
  { value: "any", label: "Anyone" },
  { value: "female", label: "Women only" },
  { value: "male", label: "Men only" }
];

export function OnboardingPreferencesStep({
  preferences,
  patchDraft
}: {
  preferences: OnboardingDraft["preferences"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2 text-ink">Who you would live with</h2>
      <ChoiceField
        legend="Flatmate gender"
        options={GENDER_OPTIONS}
        value={preferences?.gender_preference}
        onValueChange={(gender_preference) => patchDraft({ preferences: { ...preferences, gender_preference } })}
      />
    </>
  );
}
