import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import type { PropertyCreate } from "@/lib/api/types";
import { humanizeSnakeCase } from "@/lib/utils";

const GENDER_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "male", label: "Male only" },
  { value: "female", label: "Female only" }
] as const;

const ADDITIONAL_TAGS = ["veg_only", "no_smoking", "no_drinking", "no_pets", "early_riser", "night_owl"];

export function PostPreferencesStep({
  genderPreference,
  tags,
  onGenderPreferenceChange,
  onToggleTag
}: {
  genderPreference?: PropertyCreate["gender_preference"];
  tags: string[];
  onGenderPreferenceChange: (value: PropertyCreate["gender_preference"]) => void;
  onToggleTag: (tag: string) => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Preferences</h2>
      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-labelledby="gender-preference-label">
          <p id="gender-preference-label" className="text-label-md text-ink-2 mb-2">Gender Preference</p>
          <div className="flex flex-wrap gap-2">
            {GENDER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                variant="choice"
                selected={genderPreference === opt.value}
                onClick={() => onGenderPreferenceChange(opt.value as PropertyCreate["gender_preference"])}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
        <div role="group" aria-labelledby="additional-tags-label">
          <p id="additional-tags-label" className="text-label-md text-ink-2 mb-2">Additional Tags</p>
          <div className="flex flex-wrap gap-2">
            {ADDITIONAL_TAGS.map((tag) => (
              <Chip
                key={tag}
                selected={tags.includes(tag)}
                onClick={() => onToggleTag(tag)}
              >
                {humanizeSnakeCase(tag)}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
