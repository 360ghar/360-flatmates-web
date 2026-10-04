import type { ReactNode } from "react";
import { RadioGroup } from "radix-ui";
import { chipClasses } from "./Chip";
import { cn } from "./component-utils";

export interface ChoiceOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ChoiceChipsProps<T extends string> {
  options: ReadonlyArray<ChoiceOption<T>>;
  value: T | undefined;
  onValueChange: (value: T) => void;
  /** Accessible name of the group. */
  label: string;
  className?: string;
}

/** Pick one of a few chips. A radio group: one tab stop, arrow keys move. */
export function ChoiceChips<T extends string>({ options, value, onValueChange, label, className }: ChoiceChipsProps<T>) {
  return (
    <RadioGroup.Root
      value={value ?? ""}
      onValueChange={(next) => onValueChange(next as T)}
      aria-label={label}
      orientation="horizontal"
      loop
      className={cn("flex flex-wrap gap-2", className)}
    >
      {options.map((option) => (
        <RadioGroup.Item
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className={chipClasses(option.value === value, "choice")}
        >
          {option.icon ? <span className="flex h-4 w-4 items-center justify-center">{option.icon}</span> : null}
          <span className="truncate">{option.label}</span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}

/** ChoiceChips under a visible question: a fieldset whose legend names the group. */
export function ChoiceField<T extends string>({ legend, ...chips }: Omit<ChoiceChipsProps<T>, "label"> & { legend: string }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-label-lg text-ink">{legend}</legend>
      <ChoiceChips label={legend} {...chips} />
    </fieldset>
  );
}
