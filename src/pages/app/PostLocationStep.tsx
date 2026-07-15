import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { PropertyCreate } from "@/lib/api/types";

export function PostLocationStep({
  form,
  showStepError,
  onChange
}: {
  form: Partial<PropertyCreate>;
  showStepError: boolean;
  onChange: (patch: Partial<PropertyCreate>) => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="text-h3">Location</h2>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-ink-2">City</span>
          <Input
            placeholder="Gurugram"
            value={form.city ?? ""}
            aria-invalid={showStepError && !form.city?.trim() ? true : undefined}
            onChange={(e) => onChange({ city: e.target.value })}
          />
          {showStepError && !form.city?.trim() && (
            <span className="text-caption text-error">City is required.</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-ink-2">Locality</span>
          <Input
            placeholder="DLF Phase 1"
            value={form.locality ?? ""}
            aria-invalid={showStepError && !form.locality?.trim() ? true : undefined}
            onChange={(e) => onChange({ locality: e.target.value })}
          />
          {showStepError && !form.locality?.trim() && (
            <span className="text-caption text-error">Locality is required.</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-ink-2">Address</span>
          <Input
            placeholder="Full address"
            value={form.address ?? ""}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </label>
      </div>
    </Card>
  );
}
