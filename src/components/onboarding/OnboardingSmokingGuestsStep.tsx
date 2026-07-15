import { Chip } from "@/components/ui/Chip";
import type { GuestsPolicy, SmokingDrinking } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingSmokingGuestsStep({
  lifestyle,
  patchDraft
}: {
  lifestyle: OnboardingDraft["lifestyle"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2">Smoking & Guests</h2>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-label-md text-ink-2 mb-2">Smoking / Drinking</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Smoking and drinking">
            {(["neither", "smoke_outside", "drink_occasionally", "both_fine"] as const).map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={lifestyle?.smoking_drinking === val}
                onClick={() =>
                  patchDraft({ lifestyle: { ...lifestyle, smoking_drinking: val as SmokingDrinking } })
                }
              >
                {val === "neither" ? "Neither" : val === "smoke_outside" ? "Smoke Outside" : val === "drink_occasionally" ? "Drink Occasionally" : "Both Fine"}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="text-label-md text-ink-2 mb-2">Guests Policy</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Guests policy">
            {(["no_overnight_guests", "occasional_ok", "open_house"] as const).map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={lifestyle?.guests_policy === val}
                onClick={() =>
                  patchDraft({ lifestyle: { ...lifestyle, guests_policy: val as GuestsPolicy } })
                }
              >
                {val === "no_overnight_guests" ? "No Overnight" : val === "occasional_ok" ? "Occasional OK" : "Open House"}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
