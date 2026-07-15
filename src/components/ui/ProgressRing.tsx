import { useState, useEffect, type HTMLAttributes } from "react";
import { clampPercentage, cn } from "./component-utils";

export type ProgressRingSize = "sm" | "md" | "lg" | "xl";

export interface ProgressRingProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: ProgressRingSize;
  label?: string;
  showValue?: boolean;
}

const sizeMap: Record<ProgressRingSize, { box: number; stroke: number; text: string }> = {
  sm: { box: 32, stroke: 3, text: "text-[10px]" },
  md: { box: 44, stroke: 4, text: "text-caption" },
  lg: { box: 56, stroke: 5, text: "text-label-md" },
  xl: { box: 80, stroke: 6, text: "text-body-md" }
};

const RING_DRAW_STYLE: React.CSSProperties = {
  transition: "stroke-dashoffset 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
};

export interface RingSvgProps {
  box: number;
  stroke: number;
  percentage: number;
  trackColor?: string;
  fillColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function RingSvg({
  box,
  stroke,
  percentage,
  trackColor = "currentColor",
  fillColor = "currentColor",
  className,
  style,
}: RingSvgProps) {
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animate drawing from 0 to percentage on mount
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const t = setTimeout(() => {
      const dashOffset = circumference - (percentage / 100) * circumference;
      setOffset(dashOffset);
    }, 100);
    return () => clearTimeout(t);
  }, [percentage, circumference]);

  return (
    <svg
      aria-hidden="true"
      className={className}
      height={box}
      viewBox={`0 0 ${box} ${box}`}
      width={box}
      style={style}
    >
      <circle
        cx={box / 2}
        cy={box / 2}
        fill="none"
        r={radius}
        stroke={trackColor}
        strokeWidth={stroke}
      />
      <circle
        className="ring-draw"
        cx={box / 2}
        cy={box / 2}
        fill="none"
        r={radius}
        stroke={fillColor}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        strokeWidth={stroke}
        transform={`rotate(-90 ${box / 2} ${box / 2})`}
        style={RING_DRAW_STYLE}
      />
    </svg>
  );
}

function toneForValue(value: number): string {
  if (value >= 70) {
    return "text-success";
  }

  if (value >= 40) {
    return "text-warning";
  }

  return "text-error";
}

export function ProgressRing({
  value,
  size = "sm",
  label,
  showValue = true,
  className,
  ...props
}: ProgressRingProps) {
  const percentage = clampPercentage(value);
  const config = sizeMap[size];

  return (
    <div
      role="progressbar"
      aria-label={label ?? "Progress"}
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: config.box, height: config.box }}
      {...props}
    >
      <RingSvg
        box={config.box}
        stroke={config.stroke}
        percentage={percentage}
        trackColor="var(--color-line)"
        fillColor="currentColor"
        className={cn(toneForValue(percentage), "absolute inset-0 -rotate-90")}
      />
      {showValue ? (
        <span className={cn("font-bold tabular-nums text-ink", config.text)}>{percentage}%</span>
      ) : null}
    </div>
  );
}
