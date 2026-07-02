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
        "group flex min-h-14 w-full items-center gap-3 px-2 py-2 text-left hover:bg-accent-soft active:scale-[0.99] rounded-xl transition-all duration-300",
        interactiveMotion,
        focusRing,
        className
      )}
      {...props}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105", classes.soft, classes.text)}>
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-md font-medium text-ink transition-colors duration-300 group-hover:text-accent">{label}</span>
        {description ? <span className="mt-0.5 block text-caption text-ink-3">{description}</span> : null}
      </span>
      {trailing ?? (
        <ChevronRight
          aria-hidden="true"
          className="h-5 w-5 shrink-0 text-ink-3 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent"
        />
      )}
    </button>
  );
}
