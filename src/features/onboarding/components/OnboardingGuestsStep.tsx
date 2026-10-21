import { ChoiceField } from "@/components/ui/ChoiceChips";
import { lifestyleOptions, type GuestsPolicy } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingGuestsStep({
  lifestyle,
  patchDraft
}: {
  lifestyle: OnboardingDraft["lifestyle"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2 text-ink">Guests</h2>
      <ChoiceField
        legend="How do you feel about guests staying over?"
        options={lifestyleOptions("guests_policy") as ReadonlyArray<{ value: GuestsPolicy; label: string }>}
        value={lifestyle?.guests_policy}
        onValueChange={(guests_policy) => patchDraft({ lifestyle: { ...lifestyle, guests_policy } })}
      />
    </>
  );
}
