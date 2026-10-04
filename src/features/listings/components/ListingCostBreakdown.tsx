import { formatCurrencyINR } from "@/lib/utils/format";

/** What moving in costs: rent, deposit and maintenance side by side. */
export function ListingCostBreakdown({
  price,
  securityDeposit,
  maintenanceCharges
}: {
  price: number;
  securityDeposit?: number | null;
  maintenanceCharges?: number | null;
}) {
  const rows = [
    { label: "Rent a month", value: formatCurrencyINR(price), strong: true },
    { label: "Deposit", value: securityDeposit ? formatCurrencyINR(securityDeposit) : "Ask the owner" },
    { label: "Maintenance", value: maintenanceCharges ? formatCurrencyINR(maintenanceCharges) : "Included" }
  ];
  return (
    <section aria-labelledby="costs-heading" className="paper-grain rounded-hand bg-surface p-5 shadow-sm md:p-7">
      <h2 id="costs-heading" className="text-h3 text-ink">What it costs</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-cut-md bg-surface-soft p-4">
            <dt className="text-caption text-ink-3">{row.label}</dt>
            <dd className={row.strong ? "mt-1 text-h4 tabular-nums text-clay" : "mt-1 text-h4 tabular-nums text-ink"}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
