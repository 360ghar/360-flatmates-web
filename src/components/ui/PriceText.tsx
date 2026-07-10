import type { HTMLAttributes } from "react";
import { cn } from "./component-utils";
import { formatCurrencyINR } from "@/lib/utils/format";

export type PriceTextVariant = "hero" | "card" | "inline";

export interface PriceTextProps extends HTMLAttributes<HTMLSpanElement> {
  // Accept optional API price fields directly; the guard below handles
  // missing/0/non-finite values uniformly.
  value: number | null | undefined;
  suffix?: string;
  variant?: PriceTextVariant;
}

const variantClasses: Record<PriceTextVariant, string> = {
  hero: "text-display font-semibold leading-none text-ink",
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
  const isValidPrice =
    typeof value === "number" && Number.isFinite(value) && value > 0;
  return (
    <span className={cn("tabular-nums", variantClasses[variant], className)} {...props}>
      {isValidPrice ? `${formatCurrencyINR(value)}${suffix}` : "Price on request"}
    </span>
  );
}
