import type { LucideIcon } from "lucide-react";
import { CalendarCheck, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";

const trustItems = [
  { icon: Sparkles, value: "6-point", label: "Lifestyle compatibility" },
  { icon: ShieldCheck, value: "Reviewed", label: "Room and profile signals" },
  { icon: MessageSquareText, value: "Context", label: "Listing-aware chats" },
  { icon: CalendarCheck, value: "Visits", label: "Scheduling in the flow" },
] as const;

function TrustItem({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-3 md:flex-1">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-h3 text-ink leading-tight">{value}</p>
        <p className="mt-1 text-caption text-ink-3">{label}</p>
      </div>
    </div>
  );
}

export function TrustStrip() {
  return (
    <section
      className="bg-paper px-5 py-5 md:px-12"
      aria-label="Platform trust signals"
    >
      <div className="mx-auto max-w-7xl rounded-[var(--radius-promo)] border border-line-low bg-surface p-3">
        <div className="grid gap-2 lg:grid-cols-[1.15fr_2.85fr] lg:items-center">
          <div className="rounded-2xl bg-paper px-5 py-4">
            <p className="text-body-lg font-semibold text-ink">Built for real shared living decisions.</p>
            <p className="mt-1 text-body-md text-ink-3">Trust, fit, chat, and visits stay connected.</p>
          </div>
          <div className="grid grid-cols-2 gap-1 md:grid-cols-4 md:divide-x md:divide-line-low/60">
            {trustItems.map((item) => (
              <TrustItem key={item.label} icon={item.icon} value={item.value} label={item.label} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
