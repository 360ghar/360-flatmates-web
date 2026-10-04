import type { HTMLAttributes } from "react";
import { CheckCircle2, Lock, Shield, ShieldCheck } from "lucide-react";
import { cn, toneClasses, type Tone } from "./component-utils";

export type TrustBadgeVariant = "verified" | "reviewed" | "safe" | "privacy";

export interface TrustBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TrustBadgeVariant;
  label?: string;
}

const config: Record<TrustBadgeVariant, { label: string; tone: Tone; icon: React.ElementType }> = {
  verified: { label: "Verified", tone: "success", icon: CheckCircle2 },
  reviewed: { label: "Reviewed", tone: "accent", icon: ShieldCheck },
  safe: { label: "Safe", tone: "teal", icon: Shield },
  privacy: { label: "Private", tone: "accent", icon: Lock }
};

export function TrustBadge({ variant = "verified", label, className, ...props }: TrustBadgeProps) {
  const item = config[variant];
  const Icon = item.icon;
  const classes = toneClasses[item.tone];

  return (
    <span
      className={cn(
        // Solid surface backing so the badge reads over photos. Cut radius,
        // never a pill (DESIGN.md §8 bans filled pills for status).
        "inline-flex items-center gap-1 rounded-cut-sm bg-surface px-1.5 py-0.5 text-label-md shadow-xs",
        classes.text,
        className
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label ?? item.label}
    </span>
  );
}

