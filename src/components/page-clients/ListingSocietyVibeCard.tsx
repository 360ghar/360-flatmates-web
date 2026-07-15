import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import type { Property } from "@/lib/api/types";

export function ListingSocietyVibeCard({ property }: { property: Property }) {
  const hasContent =
    property.society_type ||
    (property.society_amenities && property.society_amenities.length > 0) ||
    (property.society_vibe_tags && property.society_vibe_tags.length > 0);

  if (!hasContent) return null;

  return (
    <Card className="border-line p-5 shadow-sm md:p-6">
      <h2 className="text-h3 font-semibold text-ink">Society & vibe</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {property.society_type && (
          <div className="rounded-xl border border-line bg-surface-soft p-4">
            <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Society type</p>
            <p className="mt-1 text-body-lg font-medium capitalize text-ink">
              {property.society_type.replace("_", " ")}
            </p>
          </div>
        )}
        {property.society_amenities && property.society_amenities.length > 0 && (
          <div className="rounded-xl border border-line bg-surface-soft p-4 md:col-span-2">
            <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-3">
              Amenities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {property.society_amenities.map((a) => (
                <Chip key={a} variant="info" className="cursor-default border border-line bg-surface px-3 py-1 text-ink-2">
                  {a}
                </Chip>
              ))}
            </div>
          </div>
        )}
        {property.society_vibe_tags && property.society_vibe_tags.length > 0 && (
          <div className="rounded-xl border border-line bg-surface-soft p-4 md:col-span-2">
            <p className="mb-2 text-caption font-medium uppercase tracking-wide text-ink-3">Vibe</p>
            <div className="flex flex-wrap gap-1.5">
              {property.society_vibe_tags.map((t) => (
                <Chip
                  key={t}
                  variant="info"
                  className="cursor-default border border-accent/15 bg-accent-soft px-3 py-1 text-accent"
                >
                  #{t}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
