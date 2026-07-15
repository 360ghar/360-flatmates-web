import { Chip } from "@/components/ui/Chip";
import type { WorkStyle } from "@/lib/data";
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
      <h2 className="text-h2">Work Style</h2>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-label-md text-ink-2 mb-2">Where do you work from?</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Work style">
            {(["wfh", "office", "hybrid"] as const).map((val) => (
              <Chip
                variant="choice"
                key={val}
                selected={lifestyle?.work_style === val}
                onClick={() =>
                  patchDraft({ lifestyle: { ...lifestyle, work_style: val as WorkStyle } })
                }
              >
                {val === "wfh" ? "Work from Home" : val === "office" ? "Office" : "Hybrid"}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
