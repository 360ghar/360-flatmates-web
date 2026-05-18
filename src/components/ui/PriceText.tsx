import type { HTMLAttributes } from "react";
import { cn } from "./component-utils";
import { formatCurrencyINR } from "@/lib/utils/format";

export type PriceTextVariant = "hero" | "card" | "inline";

export interface PriceTextProps extends HTMLAttributes<HTMLSpanElement> {
  value: number;
  suffix?: string;
  variant?: PriceTextVariant;
}

const variantClasses: Record<PriceTextVariant, string> = {
  hero: "text-display font-normal leading-none text-ink",
  card: "text-h3 font-bold leading-tight text-ink",
  inline: "text-body-md font-semibold text-ink-2"
};

export function PriceText({
  value,
  suffix = "/mo",
  variant = "card",
  className,
  ...props
}: PriceTextProps) {
  return (
    <span className={cn("tabular-nums", variantClasses[variant], className)} {...props}>
      {formatCurrencyINR(value)}{suffix}
    </span>
  );
}

