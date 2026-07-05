import { cn } from "./component-utils";

export interface LogoProps {
  compact?: boolean;
  stacked?: boolean;
  className?: string;
}

function RotateIcon({ size }: { size: number }) {
  // A near-complete ring that reads as the digit "0": a stroked circle
  // (center 20,20, radius 13) with a ~40° opening at the top so the rotation
  // stays perceptible. A subtle filled bead just outside the gap gives the
  // slow spin a clear reference point — evoking the "360°" concept without
  // resorting to a chunky refresh arrowhead.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="animate-spin-slow motion-reduce:animate-none -mt-px"
    >
      <path
        d="M 15.55 7.78 A 13 13 0 1 1 24.45 7.78"
        stroke="currentColor"
        strokeWidth="3.25"
        strokeLinecap="round"
      />
      <circle cx="20" cy="3.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

export function Logo({ compact = false, stacked = false, className }: LogoProps) {
  const iconSize = compact ? 28 : stacked ? 22 : 36;

  if (stacked) {
    return (
      <span className={cn("inline-flex flex-col items-center text-accent", className)} aria-label="360 Flatmates">
        <span className="inline-flex items-center leading-none">
          <span className="font-serif text-[22px] font-normal tracking-[-1px]">36</span>
          <RotateIcon size={iconSize} />
        </span>
        <span className="mt-0.5 font-sans text-[10px] font-bold uppercase tracking-[2px]">Flatmates</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center text-accent", className)} aria-label="360 Flatmates">
      <span
        className={cn(
          "font-serif font-normal leading-none",
          compact ? "text-[26px] tracking-[-1.2px]" : "text-[36px] tracking-[-1.4px]"
        )}
      >
        36
      </span>
      <RotateIcon size={iconSize} />
      <span
        className={cn(
          "font-sans font-bold uppercase tracking-[1.6px]",
          compact ? "text-[12px]" : "text-[14px]"
        )}
      >
        Flatmates
      </span>
    </span>
  );
}
