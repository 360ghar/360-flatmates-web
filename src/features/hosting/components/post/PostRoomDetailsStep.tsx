import { Chip } from "@/components/ui/Chip";
import { ChoiceChips } from "@/components/ui/ChoiceChips";
import type { PropertyCreate } from "@/lib/api/types";
import { FURNISHING_LEVEL_OPTIONS, LISTING_SHARING_TYPE_OPTIONS } from "@/lib/data";
import type { FurnishingLevel } from "@/lib/data";
import { humanizeSnakeCase } from "@/lib/utils";

const SHARING_TYPE_OPTIONS = LISTING_SHARING_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label
}));

const ROOM_FEATURES = ["bed", "wardrobe", "wifi", "ac", "washing_machine", "tv", "fridge", "table", "chair", "geyser"];

export function PostRoomDetailsStep({
  sharingType,
  furnishingLevel,
  featuresSet,
  onSharingTypeChange,
  onFurnishingLevelChange,
  onToggleFeature
}: {
  sharingType?: PropertyCreate["sharing_type"];
  furnishingLevel?: FurnishingLevel;
  featuresSet: Set<string>;
  onSharingTypeChange: (value: PropertyCreate["sharing_type"]) => void;
  onFurnishingLevelChange: (value: FurnishingLevel) => void;
  onToggleFeature: (tag: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-h2 text-ink">Room details</h2>
      <div className="flex flex-col gap-4">
        <div>
          <p id="sharing-type-label" className="text-label-md text-ink-2 mb-2">Sharing type</p>
          <ChoiceChips label="Sharing type" options={SHARING_TYPE_OPTIONS} value={sharingType} onValueChange={(value) => onSharingTypeChange(value as PropertyCreate["sharing_type"])} />
        </div>
        <div>
          <p id="furnishing-level-label" className="text-label-md text-ink-2 mb-2">Furnishing level</p>
          <ChoiceChips label="Furnishing level" options={FURNISHING_LEVEL_OPTIONS} value={furnishingLevel} onValueChange={(value) => onFurnishingLevelChange(value)} />
        </div>
        <div role="group" aria-labelledby="room-features-label">
          <p id="room-features-label" className="text-label-md text-ink-2 mb-2">Room features</p>
          <div className="flex flex-wrap gap-2">
            {ROOM_FEATURES.map((tag) => (
              <Chip
                key={tag}
                selected={featuresSet.has(tag)}
                onClick={() => onToggleFeature(tag)}
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
