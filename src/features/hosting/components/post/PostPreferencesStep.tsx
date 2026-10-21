import { Chip } from "@/components/ui/Chip";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import { readEnum } from "@/lib/api/schema";
import { GENDER_PREFERENCE_VALUES, type GenderPreference } from "@/lib/data";
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
  genderPreference?: GenderPreference;
  tags: string[];
  onGenderPreferenceChange: (value: GenderPreference | undefined) => void;
  onToggleTag: (tag: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-h2 text-ink">Preferences</h2>
      <div className="flex flex-col gap-4">
        <div>
          <p id="gender-preference-label" className="text-label-md text-ink-2 mb-2">Gender preference</p>
          <ChoiceChips label="Gender preference" options={GENDER_OPTIONS} value={genderPreference} onValueChange={(value) => onGenderPreferenceChange(readEnum(GENDER_PREFERENCE_VALUES, value) ?? undefined)} />
        </div>
        <div role="group" aria-labelledby="additional-tags-label">
          <p id="additional-tags-label" className="text-label-md text-ink-2 mb-2">Additional tags</p>
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
    </div>
  );
}
