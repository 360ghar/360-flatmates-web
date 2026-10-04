import { Input, SelectField } from "@/components/ui/Input";
import type { PropertyCreate } from "@/lib/api/types";
import { useKitchenTypes, useVentilationOptions } from "@/hooks/queries/useCatalogs";
import { optionalNumberValue } from "@/lib/utils/format";

function intValue(raw: string): number | undefined {
  const value = optionalNumberValue(raw);
  return value === undefined ? undefined : Math.trunc(value);
}

export function PostPropertyDetailsStep({
  form,
  onChange
}: {
  form: Partial<PropertyCreate>;
  onChange: (patch: Partial<PropertyCreate>) => void;
}) {
  const { data: kitchenTypes } = useKitchenTypes();
  const { data: ventilationOptions } = useVentilationOptions();

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-h2 text-ink">Property details</h2>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-ink-2">Description</span>
          <textarea
            className="min-h-[100px] w-full resize-y rounded-cut-md border border-line bg-surface px-3 py-2.5 text-body-md text-ink placeholder:text-ink-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            <span className="text-label-md text-ink-2">Available from</span>
            <Input
              type="date"
              value={form.available_from ?? ""}
              onChange={(e) => onChange({ available_from: e.target.value })}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-ink-2">Floor number</span>
            <Input
              type="number"
              min={0}
              placeholder="3"
              value={form.floor_number !== undefined ? String(form.floor_number) : ""}
              onChange={(e) => onChange({ floor_number: intValue(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-ink-2">Total floors</span>
            <Input
              type="number"
              min={1}
              placeholder="12"
              value={form.total_floors !== undefined ? String(form.total_floors) : ""}
              onChange={(e) => onChange({ total_floors: intValue(e.target.value) })}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-ink-2">Windows count</span>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="3"
              value={form.windows_count !== undefined ? String(form.windows_count) : ""}
              onChange={(e) => onChange({ windows_count: intValue(e.target.value) })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-label-md text-ink-2">Ventilation shafts</span>
            <Input
              type="number"
              min={0}
              max={50}
              placeholder="1"
              value={form.ventilation_shafts !== undefined ? String(form.ventilation_shafts) : ""}
              onChange={(e) => onChange({ ventilation_shafts: intValue(e.target.value) })}
            />
          </label>
        </div>
        <SelectField
          label="Kitchen type"
          placeholder="Select kitchen type"
          value={form.kitchen_type ?? ""}
          options={kitchenTypes.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(e) =>
            onChange({ kitchen_type: (e.target.value || undefined) as PropertyCreate["kitchen_type"] })
          }
        />
        <SelectField
          label="Ventilation"
          placeholder="Select ventilation"
          value={form.ventilation_type ?? ""}
          options={ventilationOptions.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(e) =>
            onChange({ ventilation_type: (e.target.value || undefined) as PropertyCreate["ventilation_type"] })
          }
        />
      </div>
    </div>
  );
}
