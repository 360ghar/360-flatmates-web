import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { humanizeSnakeCase } from "@/lib/utils";

const SOCIETY_AMENITIES = ["gym", "pool", "parking", "security", "power_backup", "lift", "garden", "clubhouse", "intercom", "cctv"];
const VIBE_TAGS = ["quiet", "social", "family_friendly", "pet_friendly", "young_crowd", "luxury", "budget_friendly"];

export function PostAmenitiesStep({
  societyAmenitiesSet,
  vibeTags,
  onToggleAmenity,
  onToggleVibeTag
}: {
  societyAmenitiesSet: Set<string>;
  vibeTags: string[];
  onToggleAmenity: (amenity: string) => void;
  onToggleVibeTag: (tag: string) => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Amenities</h2>
      <div className="flex flex-col gap-4">
        <div role="group" aria-labelledby="society-amenities-label">
          <p id="society-amenities-label" className="text-label-md text-ink-2 mb-2">Society Amenities</p>
          <div className="flex flex-wrap gap-2">
            {SOCIETY_AMENITIES.map((amenity) => (
              <Chip
                key={amenity}
                selected={societyAmenitiesSet.has(amenity)}
                onClick={() => onToggleAmenity(amenity)}
              >
                {humanizeSnakeCase(amenity)}
              </Chip>
            ))}
          </div>
        </div>
        <div role="group" aria-labelledby="vibe-tags-label">
          <p id="vibe-tags-label" className="text-label-md text-ink-2 mb-2">Vibe Tags</p>
          <div className="flex flex-wrap gap-2">
            {VIBE_TAGS.map((tag) => (
              <Chip
                key={tag}
                selected={vibeTags.includes(tag)}
                onClick={() => onToggleVibeTag(tag)}
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
