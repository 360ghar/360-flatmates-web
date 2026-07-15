import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { PropertyCreate } from "@/lib/api/types";
import { optionalNumberValue } from "./postListingUtils";

export function PostBasicInfoStep({
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
      <h2 className="text-h3">Basic Information</h2>
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-ink-2">Title</span>
          <Input
            placeholder="e.g. Spacious 1BHK in DLF Phase 1"
            value={form.title ?? ""}
            aria-invalid={
              showStepError &&
              (!form.title?.trim() || (form.title?.trim().length ?? 0) < 5)
                ? true
                : undefined
            }
            onChange={(e) => onChange({ title: e.target.value })}
          />
          {showStepError && (!form.title?.trim() || (form.title?.trim().length ?? 0) < 5) && (
            <span className="text-caption text-error">Title must be at least 5 characters.</span>
          )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-ink-2">Monthly Rent</span>
          <Input
            type="number"
            placeholder="15000"
            value={form.monthly_rent !== undefined ? String(form.monthly_rent) : ""}
            aria-invalid={
              showStepError &&
              (!Number.isFinite(form.monthly_rent) || (form.monthly_rent ?? 0) < 500)
                ? true
                : undefined
            }
            onChange={(e) => onChange({ monthly_rent: optionalNumberValue(e.target.value) })}
          />
          {showStepError &&
            (!Number.isFinite(form.monthly_rent) || (form.monthly_rent ?? 0) < 500) && (
              <span className="text-caption text-error">
                Enter a monthly rent of at least ₹500.
              </span>
            )}
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-label-md text-ink-2">Security Deposit</span>
          <Input
            type="number"
            placeholder="30000"
            value={form.security_deposit !== undefined ? String(form.security_deposit) : ""}
            onChange={(e) => onChange({ security_deposit: optionalNumberValue(e.target.value) })}
          />
        </label>
      </div>
    </Card>
  );
}
