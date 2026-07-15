import { Input } from "@/components/ui/Input";
import type { OnboardingDraft } from "@/lib/schemas/onboarding";

export function OnboardingBasicInfoStep({
  basicInfo,
  patchDraft
}: {
  basicInfo: OnboardingDraft["basic_info"];
  patchDraft: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <>
      <h2 className="text-h2">Tell us about yourself</h2>
      <div className="flex flex-col gap-3">
        <Input
          label="Full name"
          placeholder="Full name"
          value={basicInfo?.full_name ?? ""}
          onChange={(e) =>
            patchDraft({
              basic_info: { ...basicInfo, full_name: e.target.value }
            })
          }
        />
        <Input
          label="Age"
          type="number"
          placeholder="Age"
          value={basicInfo?.age ? String(basicInfo.age) : ""}
          onChange={(e) => {
            // Guard against `Number("") === 0` and `Number("abc") === NaN`.
            // An empty input means "no value yet" — keep the field
            // undefined so the optional-age validation stays honest.
            const raw = e.target.value;
            if (raw === "") {
              patchDraft({
                basic_info: { ...basicInfo, age: undefined }
              });
              return;
            }
            const parsed = Number(raw);
            if (!Number.isFinite(parsed)) return;
            patchDraft({
              basic_info: { ...basicInfo, age: parsed }
            });
          }}
        />
        <Input
          label="Profession"
          placeholder="Profession"
          value={basicInfo?.profession ?? ""}
          onChange={(e) =>
            patchDraft({
              basic_info: { ...basicInfo, profession: e.target.value }
            })
          }
        />
      </div>
    </>
  );
}
