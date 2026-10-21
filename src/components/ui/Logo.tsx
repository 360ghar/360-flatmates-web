import { cn } from "./component-utils";

export interface LogoProps {
  compact?: boolean;
  iconOnly?: boolean;
  stacked?: boolean;
  className?: string;
}

/**
 * Brand wordmark: "360 Flatmates" set in Gambarino (DESIGN.md §2).
 * "360" carries the clay brand colour; "Flatmates" sits in ink on the same
 * baseline. Sentence case, no tracking. iconOnly shows just "360".
 */
export function Logo({ compact = false, iconOnly = false, stacked = false, className }: LogoProps) {
  if (stacked) {
    return (
      <span className={cn("inline-flex flex-col items-center font-display", className)} aria-label="360 Flatmates">
        <span className="text-[28px] leading-none text-accent">360</span>
        <span className="mt-0.5 text-[15px] leading-none text-ink">Flatmates</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline gap-1.5 font-display leading-none", className)} aria-label="360 Flatmates">
      <span className={cn("text-accent", compact ? "text-[24px]" : "text-[32px]")}>360</span>
      {!iconOnly ? (
        <span className={cn("text-ink", compact ? "text-[20px]" : "text-[26px]")}>Flatmates</span>
      ) : null}
    </span>
  );
}
