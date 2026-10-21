import { readListingPreferences } from "@/lib/api/property-fields";
import type { Property } from "@/lib/api/types";

/** The building and the people in it: society type, shared amenities, vibe. */
export function ListingSocietyVibeCard({ property }: { property: Property }) {
  const { societyType, societyAmenities: amenities, societyVibeTags: vibes } = readListingPreferences(property);
  if (!societyType && amenities.length === 0 && vibes.length === 0) return null;

  return (
    <section aria-labelledby="society-heading" className="paper-grain rounded-hand bg-surface p-5 shadow-sm md:p-7">
      <h2 id="society-heading" className="text-h3 text-ink">The society</h2>
      <dl className="mt-4 grid gap-5 sm:grid-cols-2">
        {societyType ? (
          <div>
            <dt className="text-caption text-ink-3">Type</dt>
            <dd className="mt-0.5 text-body-lg font-semibold capitalize text-ink">{societyType.replace(/_/g, " ")}</dd>
          </div>
        ) : null}
        {vibes.length > 0 ? (
          <div>
            <dt className="text-caption text-ink-3">Residents describe it as</dt>
            <dd className="mt-0.5 text-body-lg text-ink">{vibes.map((tag) => tag.replace(/[-_]/g, " ")).join(", ")}</dd>
          </div>
        ) : null}
        {amenities.length > 0 ? (
          <div className="sm:col-span-2">
            <dt className="text-caption text-ink-3">Shared amenities</dt>
            <dd className="mt-0.5 text-body-lg text-ink-2">{amenities.join(", ")}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
