import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn, focusRing, interactiveMotion, toneClasses, type Tone } from "../ui/component-utils";

export interface MenuItemRowProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: LucideIcon;
  label: string;
  description?: string;
  tone?: Tone;
  trailing?: ReactNode;
  /** @deprecated No longer needed; parent Card with `divide-y` handles borders. */
  isLast?: boolean;
}

export function MenuItemRow({
  icon: Icon,
  label,
  description,
  tone = "neutral",
  trailing,
  isLast: _isLast,
  className,
  ...props
}: MenuItemRowProps) {
  const classes = toneClasses[tone];

  return (
    <button
      type="button"
      className={cn(
        "group flex min-h-14 w-full items-center gap-3 rounded-cut-md px-3 py-2 text-left hover:bg-surface-soft",
        interactiveMotion,
        focusRing,
        className
      )}
      {...props}
    >
      {/* Bare icon, no tile behind it (DESIGN.md §9). Tone colours only for meaning. */}
      <Icon aria-hidden="true" className={cn("h-5 w-5 shrink-0", tone === "neutral" ? "text-ink-2" : classes.text)} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-md font-semibold text-ink">{label}</span>
        {description ? <span className="mt-0.5 block text-caption text-ink-2">{description}</span> : null}
      </span>
      {trailing ?? (
        <ChevronRight
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-ink-3 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
    </button>
  );
}
