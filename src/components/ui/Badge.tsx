import type { HTMLAttributes, ReactNode } from "react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { cn, toneClasses, type Tone } from "./component-utils";
import { FLATMATE_MODE_OPTIONS, type FlatmatesMode } from "@/lib/data";

export type BadgeVariant = "default" | "mode" | "verified" | "status" | "count";
export type UserMode = FlatmatesMode;
export type StatusTone = "confirmed" | "pending" | "rejected" | "completed" | "cancelled";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  tone?: Tone;
  mode?: UserMode;
  status?: StatusTone;
  count?: number;
  icon?: ReactNode;
  dot?: boolean;
}

const modeConfig: Record<UserMode, { label: string; tone: Tone }> = Object.fromEntries(
  FLATMATE_MODE_OPTIONS.map((opt) => [
    opt.value,
    { label: opt.label, tone: opt.value === "room_poster" ? "accent" : opt.value === "co_hunter" ? "teal" : "purple" }
  ])
) as Record<UserMode, { label: string; tone: Tone }>;

const statusTone: Record<StatusTone, Tone> = {
  confirmed: "success",
  pending: "warning",
  rejected: "error",
  completed: "neutral",
  cancelled: "error"
};

export function Badge({
  variant = "default",
  tone = "neutral",
  mode,
  status,
  count,
  icon,
  dot = false,
  children,
  className,
  ...props
}: BadgeProps) {
  if (variant === "count") {
    return (
      <span
        className={cn(
          "inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[12px] font-bold leading-none text-paper",
          className
        )}
        {...props}
      >
        {count}
      </span>
    );
  }

  const resolvedMode = mode ? modeConfig[mode] : undefined;

  function resolveTone(): Tone {
    if (variant === "mode" && resolvedMode) return resolvedMode.tone;
    if (variant === "verified") return "success";
    if (variant === "status" && status) return statusTone[status];
    return tone;
  }

  const resolvedTone = resolveTone();
  const classes = toneClasses[resolvedTone];
  const content =
    children ??
    (variant === "mode" && resolvedMode
      ? resolvedMode.label
      : variant === "verified"
        ? "Verified"
        : status);

  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-1 text-label-md font-semibold",
        classes.soft,
        classes.inkText,
        classes.border,
        className
      )}
      {...props}
    >
      {dot || variant === "status" ? (
        <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", classes.dot)} />
      ) : null}
      {icon ? (
        <span className={cn("flex h-4 w-4 items-center justify-center", classes.icon)}>{icon}</span>
      ) : null}
      {variant === "verified" && !icon ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : null}
      {variant === "mode" && !icon ? <ShieldCheck aria-hidden="true" className="h-4 w-4" /> : null}
      {content ? <span className="truncate">{content}</span> : null}
    </span>
  );
}

