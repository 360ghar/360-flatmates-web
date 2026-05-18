import type { HTMLAttributes } from "react";
import { Pencil } from "lucide-react";
import { cn, getInitials, clampPercentage } from "./component-utils";
import { RingSvg } from "./ProgressRing";

export type AvatarSize = "compact" | "sm" | "md" | "lg" | "xl";
export type AvatarShape = "editorial" | "circle";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  ringValue?: number;
  /** When true, renders an animated SVG ring that draws on mount (300ms ease-out) */
  animated?: boolean;
  editable?: boolean;
  onEdit?: () => void;
}

const sizeClasses: Record<AvatarSize, string> = {
  compact: "h-[34px] w-[34px] text-caption",
  sm: "h-10 w-10 text-label-md",
  md: "h-[52px] w-[52px] text-body-md",
  lg: "h-20 w-20 text-h3",
  xl: "h-[120px] w-[120px] text-h2"
};

const editButtonSize: Record<AvatarSize, string> = {
  compact: "hidden",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-7 w-7",
  xl: "h-8 w-8"
};

/** Map avatar size to SVG ring dimensions */
const ringSizeMap: Record<AvatarSize, { box: number; stroke: number; inset: number }> = {
  compact: { box: 44, stroke: 2.5, inset: 5 },
  sm:      { box: 48, stroke: 2.5, inset: 4 },
  md:      { box: 62, stroke: 3,   inset: 5 },
  lg:      { box: 88, stroke: 3.5, inset: 4 },
  xl:      { box: 130, stroke: 4,  inset: 5 },
};

export function Avatar({
  name,
  src,
  alt,
  size = "md",
  shape = "editorial",
  ringValue,
  animated = false,
  editable = false,
  onEdit,
  className,
  ...props
}: AvatarProps) {
  const roundedClass = shape === "circle" ? "rounded-full" : "rounded-xl";
  const initials = getInitials(name);

  const renderRing = ringValue !== undefined && animated;
  const ringConfig = ringSizeMap[size];
  const ringPercentage = ringValue !== undefined ? clampPercentage(ringValue) : 0;

  return (
    <div className={cn("relative inline-flex shrink-0", className)} {...props}>
      {ringValue !== undefined && !animated ? (
        <span
          aria-hidden="true"
          className="absolute -inset-1 rounded-[inherit] border-2 border-accent/70"
        />
      ) : null}
      {renderRing ? (
        <RingSvg
          box={ringConfig.box}
          stroke={ringConfig.stroke}
          percentage={ringPercentage}
          trackColor="var(--color-line)"
          fillColor="var(--color-accent)"
          className="pointer-events-none absolute"
          style={{
            top: -ringConfig.inset,
            left: -ringConfig.inset,
          }}
        />
      ) : null}
      <span
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-br from-accent to-accent/70 font-semibold text-white shadow-md",
          sizeClasses[size],
          roundedClass
        )}
      >
        {src ? (
          <img
            alt={alt ?? name}
            className="object-cover absolute inset-0 h-full w-full"
            src={src}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span aria-hidden="true">{initials}</span>
        )}
      </span>
      {editable ? (
        <button
          type="button"
          aria-label={`Edit ${name} avatar`}
          className={cn(
            "absolute -bottom-1 -right-1 inline-flex items-center justify-center rounded-full bg-accent text-white shadow-md transition-transform duration-150 ease-out hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            editButtonSize[size]
          )}
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
