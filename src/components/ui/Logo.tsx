import { cn } from "./component-utils";

export interface LogoProps {
  compact?: boolean;
  iconOnly?: boolean;
  stacked?: boolean;
  className?: string;
}

function RotateIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="animate-spin-slow"
    >
      <path
        d="M34 20C34 27.732 27.732 34 20 34C12.268 34 6 27.732 6 20C6 12.268 12.268 6 20 6C25 6 29.3 8.9 31.6 13.2"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31.6 13.2L30 6L23.5 8"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ compact = false, iconOnly = false, stacked = false, className }: LogoProps) {
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
      {!iconOnly ? (
        <span
          className={cn(
            "font-sans font-bold uppercase tracking-[1.6px]",
            compact ? "text-[12px]" : "text-[14px]"
          )}
        >
          Flatmates
        </span>
      ) : null}
    </span>
  );
}
