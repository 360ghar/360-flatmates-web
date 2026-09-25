import type { ButtonHTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";
import { cn, focusRing } from "./component-utils";

export type ChipVariant = "filter" | "choice" | "info" | "removable";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
  selected?: boolean;
  icon?: ReactNode;
  onRemove?: () => void;
}

const sizeClasses: Record<ChipVariant, string> = {
  filter: "px-3.5 py-2 text-label-md",
  choice: "px-3.5 py-2 text-label-md",
  info: "px-3 py-1.5 text-caption",
  removable: "px-3.5 py-2 text-label-md"
};

export function Chip({
  variant = "filter",
  selected = false,
  icon,
  onRemove,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ChipProps) {
  const role = props.role ?? (variant === "choice" ? "radio" : "checkbox");
  const isRemovable = variant === "removable" && onRemove;

  // For removable chips, use a div wrapper to avoid nesting interactive elements
  if (isRemovable) {
    return (
      <div
        className={cn(
          "inline-flex min-h-11 shrink-0 items-center justify-center gap-1 rounded-cut-md font-semibold shadow-xs",
          selected ? "bg-clay-soft text-ink" : "bg-surface text-ink-2 hover:bg-paper-2",
          sizeClasses[variant],
          className
        )}
      >
        <button
          type={type}
          role={role}
          aria-checked={props["aria-checked"] ?? selected}
          disabled={disabled}
          className={cn(
            "flex flex-1 cursor-pointer items-center gap-1.5 rounded-cut-md text-center focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-ink-3"
          )}
          {...props}
        >
          {icon ? <span className="flex h-4 w-4 items-center justify-center">{icon}</span> : null}
          <span className="truncate">{children}</span>
        </button>
        <button
          type="button"
          aria-label="Remove"
          className={cn(
            "-my-2 -mr-2 flex h-11 w-10 shrink-0 items-center justify-center rounded-cut-md text-current hover:bg-paper-3",
            focusRing
          )}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type={type}
      role={role}
      aria-checked={props["aria-checked"] ?? selected}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-cut-md font-semibold shadow-xs disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-ink-3 disabled:shadow-none",
        "chip-spring",
        focusRing,
        selected ? "bg-clay-soft text-ink" : "bg-surface text-ink-2 hover:bg-paper-2",
        sizeClasses[variant],
        className
      )}
      {...props}
    >
      {icon ? <span className="flex h-4 w-4 items-center justify-center">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  );
}

