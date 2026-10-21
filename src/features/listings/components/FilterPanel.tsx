import type { HTMLAttributes } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip, type ChipVariant } from "@/components/ui/Chip";
import { SearchBar } from "@/components/ui/SearchBar";
import { cn } from "@/components/ui/component-utils";

export interface FilterOption {
  value: string;
  label: string;
  selected?: boolean;
  disabled?: boolean;
}

export interface FilterSection {
  id: string;
  title: string;
  hint?: string;
  options: FilterOption[];
  /** Chip variant for this section. Use "choice" for single-select (radio) semantics. */
  variant?: ChipVariant;
}

export interface FilterPanelProps extends HTMLAttributes<HTMLElement> {
  sections: FilterSection[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterToggle?: (sectionId: string, value: string) => void;
  onClear?: () => void;
  onApply?: () => void;
}

export function FilterPanel({
  sections,
  searchValue,
  onSearchChange,
  onFilterToggle,
  onClear,
  onApply,
  className,
  ...props
}: FilterPanelProps) {
  return (
    <aside className={cn("flex w-full flex-col gap-5 md:w-[280px]", className)} {...props}>
      <SearchBar
        value={searchValue}
        onChange={(event) => onSearchChange?.(event.target.value)}
        placeholder="Search locality or society"
        aria-label="Search locality or society"
      />
      <div className="flex flex-col gap-5">
        {sections.map((section) => (
          <section className="flex flex-col gap-2" key={section.id}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-body-md font-semibold text-ink">{section.title}</h3>
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4 text-ink-3" />
            </div>
            {section.hint ? <p className="text-caption text-ink-3">{section.hint}</p> : null}
            <div className="flex flex-wrap gap-2" role="group" aria-label={`Filter by ${section.title}`}>
              {section.options.map((option) => (
                <Chip
                  key={option.value}
                  variant={section.variant}
                  selected={option.selected}
                  disabled={option.disabled}
                  onClick={() => onFilterToggle?.(section.id, option.value)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="sticky bottom-0 mt-auto flex gap-2 bg-paper-1 paper-grain pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-1px_0_var(--color-edge)]">
        <Button fullWidth variant="secondary" onClick={onClear}>
          Clear
        </Button>
        <Button fullWidth onClick={onApply}>
          Apply
        </Button>
      </div>
    </aside>
  );
}

