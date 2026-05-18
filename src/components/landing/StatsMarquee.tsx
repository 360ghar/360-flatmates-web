import { useCountUp } from "@/hooks/useCountUp";
import { RevealSection } from "@/components/ui/RevealSection";
import { STATS } from "./landing-data";

const ALL_STATS = [...STATS, ...STATS];

function StatItem({
  numericValue,
  suffix,
  label,
}: {
  numericValue: number;
  suffix: string;
  label: string;
}) {
  const { ref, value } = useCountUp(numericValue, { duration: 2500 });

  const formatValue = (val: number, target: number) => {
    if (target === 10000) return `${(val / 1000).toFixed(0)}K+`;
    if (target === 5000) return `${(val / 1000).toFixed(0)}K+`;
    if (target === 86) return `${val}%`;
    if (target === 2) return `${val}`;
    return String(val);
  };

  return (
    <div className="flex flex-col items-center gap-3 px-16">
      <p
        className="text-display text-6xl md:text-8xl tabular text-ink"
      >
        <span ref={ref}>
          {value >= numericValue ? suffix : formatValue(value, numericValue)}
        </span>
      </p>
      <p className="text-eyebrow text-ink-3 tracking-[0.3em]">{label}</p>
    </div>
  );
}

export function StatsMarquee() {
  return (
    <section
      className="relative bg-surface py-20 md:py-24 overflow-hidden border-y border-line-low"
      aria-labelledby="stats-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mb-12 text-center">
          <p id="stats-heading" className="text-eyebrow mb-5">
            Scale & Impact
          </p>
          <h2 className="text-display text-4xl md:text-5xl text-ink">Trusted in premier neighborhoods</h2>
        </RevealSection>
      </div>

      <div className="overflow-hidden" aria-label="Platform statistics">
        <div className="animate-marquee flex gap-0 whitespace-nowrap py-10">
          {ALL_STATS.map((stat, i) => (
            <div
              key={i}
              aria-hidden={i >= STATS.length ? "true" : undefined}
            >
              <StatItem
                numericValue={stat.numericValue}
                suffix={stat.display}
                label={stat.label}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Decorative gradient masks for the marquee */}
      <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none" />

      <ul className="sr-only">
        {STATS.map((stat) => (
          <li key={stat.label}>
            {stat.display} {stat.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
