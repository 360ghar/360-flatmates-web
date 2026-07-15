import { Chip } from "@/components/ui/Chip";
import type { GenderPreference } from "@/lib/data";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingPreferencesStep({
  preferences,
  patchDraft
}: {
  preferences: OnboardingDraft["preferences"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2">Your preferences</h2>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-label-md text-ink-2 mb-2">Gender Preference</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Gender preference">
            {(["male", "female", "any"] as const).map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={preferences?.gender_preference === val}
                onClick={() =>
                  patchDraft({
                    preferences: {
                      ...preferences,
                      gender_preference: val as GenderPreference
                    }
                  })
                }
              >
                {val === "any" ? "Any" : val === "male" ? "Male only" : "Female only"}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
