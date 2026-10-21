import type { ReactNode } from "react";
import { cn } from "./component-utils";

export type Fact = [label: string, value: ReactNode];

/** Label/value pairs in a grid, as a description list. Empty values are left out. */
export function FactList({ facts, className }: { facts: Fact[]; className?: string }) {
  const shown = facts.filter(([, value]) => value != null && value !== "" && value !== false);
  if (shown.length === 0) return null;
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3", className)}>
      {shown.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-caption text-ink-3">{label}</dt>
          <dd className="mt-0.5 text-body-md font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
