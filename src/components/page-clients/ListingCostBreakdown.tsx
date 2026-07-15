import { Card } from "@/components/ui/Card";
import { PriceText } from "@/components/ui/PriceText";
import { formatCurrencyINR } from "@/lib/utils/format";

export function ListingCostBreakdown({
  price,
  securityDeposit,
  maintenanceCharges
}: {
  price: number;
  securityDeposit?: number | null;
  maintenanceCharges?: number | null;
}) {
  return (
    <Card className="border-line p-5 shadow-sm md:p-6">
      <h2 className="text-h3 font-semibold text-ink">Cost breakdown</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface-soft p-4 text-center">
          <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Monthly rent</p>
          <PriceText
            value={price}
            variant="inline"
            suffix=""
            className="mt-1 block text-h2 font-semibold text-accent"
          />
        </div>
        <div className="rounded-xl border border-line bg-surface-soft p-4 text-center">
          <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Deposit</p>
          <p className="mt-1 text-h2 font-semibold text-ink">
            {securityDeposit ? formatCurrencyINR(securityDeposit) : "TBD"}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-surface-soft p-4 text-center">
          <p className="text-caption font-medium uppercase tracking-wide text-ink-3">Maintenance</p>
          <p className="mt-1 text-h2 font-semibold text-ink">
            {maintenanceCharges ? formatCurrencyINR(maintenanceCharges) : "None"}
          </p>
        </div>
      </div>
    </Card>
  );
}
