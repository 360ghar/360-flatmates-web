import { ChoiceField } from "@/components/ui/ChoiceChips";
import { lifestyleOptions, type WorkStyle } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingWorkStyleStep({
  lifestyle,
  patchDraft
}: {
  lifestyle: OnboardingDraft["lifestyle"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2 text-ink">Work</h2>
      <ChoiceField
        legend="Where do you work from?"
        options={lifestyleOptions("work_style") as ReadonlyArray<{ value: WorkStyle; label: string }>}
        value={lifestyle?.work_style}
        onValueChange={(work_style) => patchDraft({ lifestyle: { ...lifestyle, work_style } })}
      />
    </>
  );
}
