import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { RadioGroup } from "radix-ui";
import { cn, focusRing } from "./component-utils";

export interface ChoiceCardOption<T extends string> {
  value: T;
  label: string;
  description: string;
  icon?: ReactNode;
}

export interface ChoiceCardsProps<T extends string> {
  options: ReadonlyArray<ChoiceCardOption<T>>;
  value: T | null | undefined;
  onValueChange: (value: T) => void;
  /** Accessible name of the group. */
  label: string;
  className?: string;
}

/** Pick one of a few larger options, each with a line of explanation. A radio group. */
export function ChoiceCards<T extends string>({ options, value, onValueChange, label, className }: ChoiceCardsProps<T>) {
  return (
    <RadioGroup.Root
      value={value ?? ""}
      onValueChange={(next) => onValueChange(next as T)}
      aria-label={label}
      loop
      className={cn("flex flex-col gap-3", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <RadioGroup.Item
            key={option.value}
            value={option.value}
            className={cn(
              "paper-grain flex min-h-[72px] items-center gap-4 rounded-hand p-4 text-left transition-[background-color,box-shadow] duration-200",
              focusRing,
              selected ? "bg-paper-3 shadow-sm ring-2 ring-clay" : "bg-surface shadow-xs hover:bg-paper-3"
            )}
          >
            {option.icon ? (
              <span aria-hidden="true" className={cn("shrink-0 [&_svg]:h-8 [&_svg]:w-8", selected ? "text-clay" : "text-ink-2")}>
                {option.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-body-lg font-semibold text-ink">{option.label}</span>
              <span className="mt-0.5 block text-body-md text-ink-2">{option.description}</span>
            </span>
            <span
              aria-hidden="true"
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                selected ? "bg-clay text-on-clay" : "ring-2 ring-inset ring-ink-3/40"
              )}
            >
              {selected ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
            </span>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
