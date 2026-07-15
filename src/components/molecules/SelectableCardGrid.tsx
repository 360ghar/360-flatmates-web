import type { ReactNode } from "react";
import { cn, focusRing, interactiveMotion } from "@/components/ui/component-utils";

export interface SelectableCardProps {
  icon: ReactNode;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function SelectableCard({
  icon,
  label,
  description,
  selected,
  onClick,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-4 text-left",
        focusRing,
        interactiveMotion,
        selected
          ? "border-[1.5px] border-accent bg-accent-soft"
          : "border-line bg-surface hover:border-accent/40 hover:shadow-hover",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          selected ? "bg-accent text-surface" : "bg-paper-3 text-ink-2",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-md font-semibold text-ink">{label}</p>
        <p className="text-caption text-ink-3">{description}</p>
      </div>
      {selected && (
        <div className="h-3 w-3 shrink-0 rounded-full bg-accent" />
      )}
    </button>
  );
}

export interface SelectableCardGridProps<T extends string> {
  options: Array<{ value: T; label: string; description: string }>;
  iconMap: Record<T, ReactNode>;
  selected: T | null;
  onSelect: (value: T) => void;
  className?: string;
}

export function SelectableCardGrid<T extends string>({
  options,
  iconMap,
  selected,
  onSelect,
  className,
}: SelectableCardGridProps<T>) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {options.map((option) => (
        <SelectableCard
          key={option.value}
          icon={iconMap[option.value]}
          label={option.label}
          description={option.description}
          selected={selected === option.value}
          onClick={() => onSelect(option.value)}
        />
      ))}
    </div>
  );
}
