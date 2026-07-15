import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import type { PropertyCreate } from "@/lib/api/types";
import { LISTING_SHARING_TYPE_OPTIONS } from "@/lib/data";
import { humanizeSnakeCase } from "@/lib/utils";

const SHARING_TYPE_OPTIONS = LISTING_SHARING_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label
}));

const FURNISHING_TAGS = ["furnished", "semi_furnished", "unfurnished", "bed", "wardrobe", "wifi", "ac", "washing_machine", "tv", "fridge"];

export function PostRoomDetailsStep({
  sharingType,
  featuresSet,
  onSharingTypeChange,
  onToggleFeature
}: {
  sharingType?: PropertyCreate["sharing_type"];
  featuresSet: Set<string>;
  onSharingTypeChange: (value: PropertyCreate["sharing_type"]) => void;
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
        <div role="group" aria-labelledby="furnishing-tags-label">
          <p id="furnishing-tags-label" className="text-label-md text-ink-2 mb-2">Furnishing Tags</p>
          <div className="flex flex-wrap gap-2">
            {FURNISHING_TAGS.map((tag) => (
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
