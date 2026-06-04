import type { LucideIcon } from "lucide-react";
import { MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";

import { useCountUp } from "@/hooks/useCountUp";

/* Lean trust band that sits directly under the hero. Consolidates the rating
   signal (previously a hero capsule) with the headline platform numbers, so
   neither competes with the hero value-prop. No eyebrow, no card grid. */

function CountStat({
  target,
  format,
}: {
  target: number;
  format: (value: number) => string;
}) {
  const { ref, value } = useCountUp(target, { duration: 2200 });
  return <span ref={ref}>{format(value)}</span>;
}

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
    <div className="flex flex-col items-center gap-2 px-2 py-4 text-center md:flex-1 md:px-6">
      <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
      <p className="text-display tabular text-3xl md:text-4xl text-ink leading-none tracking-tight">
        {value}
      </p>
      <p className="text-label-md text-ink-3 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function TrustStrip() {
  return (
    <section
      className="bg-surface border-y border-line-low"
      aria-label="Platform trust signals"
    >
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-12 md:py-8">
        <div className="grid grid-cols-2 gap-y-2 md:flex md:items-center md:divide-x md:divide-line-low/60">
          <TrustItem
            icon={Star}
            value={<>4.9<span className="text-ink-3 text-xl md:text-2xl">/5</span></>}
            label="Flatmate rating"
          />
          <TrustItem
            icon={Sparkles}
            value={<CountStat target={10000} format={(v) => `${Math.round(v / 1000)}K+`} />}
            label="Matches made"
          />
          <TrustItem
            icon={ShieldCheck}
            value={<CountStat target={5000} format={(v) => `${Math.round(v / 1000)}K+`} />}
            label="Verified rooms"
          />
          <TrustItem
            icon={MapPin}
            value={<CountStat target={2} format={(v) => `${v}`} />}
            label="Cities live"
          />
        </div>
      </div>

      <ul className="sr-only">
        <li>4.9 out of 5 flatmate rating</li>
        <li>10,000+ matches made</li>
        <li>5,000+ verified rooms</li>
        <li>2 cities live</li>
      </ul>
    </section>
  );
}
