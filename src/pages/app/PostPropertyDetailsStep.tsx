import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { PropertyCreate } from "@/lib/api/types";
import { optionalNumberValue } from "./postListingUtils";

export function PostPropertyDetailsStep({
  form,
  onChange
}: {
  form: Partial<PropertyCreate>;
  onChange: (patch: Partial<PropertyCreate>) => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Property Details</h2>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-ink-2">Description</span>
          <textarea
            className="min-h-[100px] w-full resize-y rounded-[8px] border border-line bg-surface px-3 py-2.5 text-body-md text-ink placeholder:text-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            placeholder="Describe your listing..."
            value={form.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-ink-2">Bedrooms</span>
            <Input
              type="number"
              placeholder="1"
              value={form.bedrooms !== undefined ? String(form.bedrooms) : ""}
              onChange={(e) => onChange({ bedrooms: optionalNumberValue(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-ink-2">Bathrooms</span>
            <Input
              type="number"
              placeholder="1"
              value={form.bathrooms !== undefined ? String(form.bathrooms) : ""}
              onChange={(e) => onChange({ bathrooms: optionalNumberValue(e.target.value) })}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-ink-2">Area (sq ft)</span>
            <Input
              type="number"
              placeholder="800"
              value={form.area_sqft !== undefined ? String(form.area_sqft) : ""}
              onChange={(e) => onChange({ area_sqft: optionalNumberValue(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-ink-2">Available From</span>
            <Input
              type="date"
              value={form.available_from ?? ""}
              onChange={(e) => onChange({ available_from: e.target.value })}
            />
          </label>
        </div>
      </div>
    </Card>
  );
}
