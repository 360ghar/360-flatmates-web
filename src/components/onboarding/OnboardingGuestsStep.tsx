import { Chip } from "@/components/ui/Chip";
import { GUESTS_POLICY_VALUES, type GuestsPolicy } from "@/lib/data";
import { humanizeSnakeCase } from "@/lib/utils";
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
      <h2 className="text-h2">Guests policy</h2>
      <p className="text-body-md text-ink-2">
        How comfortable are you with guests staying over?
      </p>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-label-md text-ink-2 mb-2">Guests Policy</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Guests policy">
            {GUESTS_POLICY_VALUES.map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={lifestyle?.guests_policy === val}
                onClick={() =>
                  patchDraft({ lifestyle: { ...lifestyle, guests_policy: val as GuestsPolicy } })
                }
              >
                {val === "no_overnight_guests"
                  ? "No Overnight"
                  : humanizeSnakeCase(val)}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
