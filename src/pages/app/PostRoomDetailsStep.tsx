import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
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
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Room Details</h2>
      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-labelledby="sharing-type-label">
          <p id="sharing-type-label" className="text-label-md text-ink-2 mb-2">Sharing Type</p>
          <div className="flex flex-wrap gap-2">
            {SHARING_TYPE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                variant="choice"
                selected={sharingType === opt.value}
                onClick={() => onSharingTypeChange(opt.value as PropertyCreate["sharing_type"])}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
        <div role="radiogroup" aria-labelledby="furnishing-level-label">
          <p id="furnishing-level-label" className="text-label-md text-ink-2 mb-2">Furnishing Level</p>
          <div className="flex flex-wrap gap-2">
            {FURNISHING_LEVEL_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                variant="choice"
                selected={furnishingLevel === opt.value}
                onClick={() => onFurnishingLevelChange(opt.value)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
        <div role="group" aria-labelledby="room-features-label">
          <p id="room-features-label" className="text-label-md text-ink-2 mb-2">Room Features</p>
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
    </Card>
  );
}
