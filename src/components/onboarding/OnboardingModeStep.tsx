import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FLATMATE_MODE_OPTIONS, type FlatmatesMode } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingModeStep({
  mode,
  patchDraft
}: {
  mode: FlatmatesMode;
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2">How will you use 360 Flatmates?</h2>
      <SegmentedControl
        options={[...FLATMATE_MODE_OPTIONS]}
        value={mode}
        onValueChange={(value) => patchDraft({ mode: value as FlatmatesMode })}
        ariaLabel="Select your mode"
      />
    </>
  );
}
