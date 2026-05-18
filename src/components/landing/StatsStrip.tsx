import { useCountUp } from "@/hooks/useCountUp";
import { RevealSection } from "@/components/ui/RevealSection";
import { STATS } from "./landing-data";

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
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-paper-2 border border-line-low px-6 py-5">
      <p className="text-display text-4xl md:text-5xl tabular text-ink">
        <span ref={ref}>
          {value >= numericValue ? suffix : formatValue(value, numericValue)}
        </span>
      </p>
      <p className="text-eyebrow text-ink-3">{label}</p>
    </div>
  );
}

export function StatsStrip() {
  return (
    <section
      className="relative bg-surface py-16 md:py-20 border-y border-line-low"
      aria-labelledby="stats-heading"
    >
      <div className="mx-auto max-w-7xl px-5 md:px-12">
        <RevealSection className="mb-10 text-center">
          <p id="stats-heading" className="text-eyebrow mb-4">
            By the numbers
          </p>
          <h2 className="text-h1 text-ink">The proof is in the platform</h2>
        </RevealSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <StatItem
              key={stat.label}
              numericValue={stat.numericValue}
              suffix={stat.display}
              label={stat.label}
            />
          ))}
        </div>
      </div>

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
