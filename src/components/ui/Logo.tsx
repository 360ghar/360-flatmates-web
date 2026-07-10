import { cn } from "./component-utils";

export interface LogoProps {
  compact?: boolean;
  iconOnly?: boolean;
  stacked?: boolean;
  className?: string;
}

/**
 * Brand wordmark: typographic "360 Flatmates" lockup.
 * Pure text (no SVG digit) so weight, baseline, and size stay consistent
 * with Inter UI type in every chrome surface (public nav, app shell, auth, admin).
 * When iconOnly is true (collapsed sidebar), only the "360" mark is shown.
 */
export function Logo({ compact = false, iconOnly = false, stacked = false, className }: LogoProps) {
  if (stacked) {
    return (
      <span
        className={cn("inline-flex flex-col items-center text-accent", className)}
        aria-label="360 Flatmates"
      >
        <span className="font-sans text-[24px] font-bold leading-none tracking-[-0.04em]">360</span>
        <span className="mt-1 font-sans text-[10px] font-bold uppercase leading-none tracking-[0.14em]">
          Flatmates
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex items-end text-accent", className)}
      aria-label="360 Flatmates"
    >
      <span
        className={cn(
          "font-sans font-bold leading-none tracking-[-0.04em]",
          compact ? "text-[22px]" : "text-[32px]"
        )}
      >
        360
      </span>
      {!iconOnly ? (
        <span
          className={cn(
            "font-sans font-bold uppercase leading-none tracking-[0.12em]",
            compact ? "ml-1.5 text-[11px] pb-px" : "ml-2 text-[13px] pb-0.5"
          )}
        >
          Flatmates
        </span>
      ) : null}
    </span>
  );
}
