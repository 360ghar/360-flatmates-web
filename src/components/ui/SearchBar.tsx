import type { InputHTMLAttributes, ReactNode } from "react";
import { useId, useState } from "react";
import { Search, X } from "lucide-react";
import { cn, focusRing, interactiveMotion } from "./component-utils";

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  onClear?: () => void;
  recentSearches?: string[];
  showRecentSearches?: boolean;
  onRecentSearchSelect?: (query: string) => void;
  onClearHistory?: () => void;
}

export function SearchBar({
  leadingIcon,
  trailingIcon,
  onClear,
  recentSearches = [],
  showRecentSearches = false,
  onRecentSearchSelect,
  onClearHistory,
  className,
  value,
  defaultValue,
  disabled,
  onKeyDown: consumerOnKeyDown,
  placeholder = "Search listings, localities, or flatmates",
  ...props
}: SearchBarProps) {
  const rawValue = value ?? defaultValue;
  const hasValue = typeof rawValue === "string" && rawValue.length > 0;
  const listboxId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const visibleRecents = showRecentSearches ? recentSearches.slice(0, 5) : [];
  const isListboxOpen = visibleRecents.length > 0;

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && isListboxOpen) {
      event.preventDefault();
      setActiveIndex(-1);
      event.currentTarget.blur();
      return;
    }
    if (event.key === "ArrowDown" && isListboxOpen) {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % visibleRecents.length);
      return;
    }
    if (event.key === "ArrowUp" && isListboxOpen) {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? visibleRecents.length - 1 : i - 1));
      return;
    }
    if (event.key === "Enter" && isListboxOpen && activeIndex >= 0) {
      event.preventDefault();
      onRecentSearchSelect?.(visibleRecents[activeIndex]);
      return;
    }
    consumerOnKeyDown?.(event);
  };

  const handlePopoverKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isListboxOpen) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setActiveIndex(-1);
      const input = (event.currentTarget.previousElementSibling?.querySelector("input") as HTMLInputElement | null);
      input?.focus();
      input?.blur();
      return;
    }
    if (visibleRecents.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % visibleRecents.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? visibleRecents.length - 1 : i - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(visibleRecents.length - 1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      onRecentSearchSelect?.(visibleRecents[activeIndex]);
    }
  };

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "group flex h-12 items-center gap-2 rounded-[9px] border border-line bg-surface px-3 text-ink shadow-xs focus-within:border-accent/50 focus-within:shadow-focus hover:border-accent/30",
          interactiveMotion,
          disabled && "bg-paper-4 text-ink-3",
          className
        )}
      >
        <span className="text-ink-3 group-focus-within:text-accent">
          {leadingIcon ?? <Search aria-hidden="true" className="h-5 w-5" />}
        </span>
        <input
          type="search"
          role="combobox"
          aria-expanded={isListboxOpen}
          aria-controls={isListboxOpen ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={isListboxOpen && activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
          onKeyDown={handleInputKeyDown}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-body-md text-ink outline-none placeholder:text-ink-3 disabled:cursor-not-allowed",
            focusRing
          )}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          {...props}
        />
        {hasValue && onClear ? (
          <button
            type="button"
            aria-label="Clear search"
            className={cn("rounded-[9px] p-1 text-ink-3 hover:bg-paper-2 hover:text-ink", focusRing)}
            onClick={onClear}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : (
          trailingIcon
        )}
      </div>
      {isListboxOpen ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Recent searches"
          onKeyDown={handlePopoverKeyDown}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-[var(--z-overlay)] rounded-lg border border-line bg-surface p-2 shadow-md"
        >
          <div className="flex flex-col">
            {visibleRecents.map((query, index) => (
              <button
                type="button"
                id={`${listboxId}-opt-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={cn(
                  "rounded-[9px] px-3 py-2 text-left text-body-md text-ink hover:bg-accent-soft",
                  index === activeIndex && "bg-accent-soft"
                )}
                key={query}
                onClick={() => onRecentSearchSelect?.(query)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {query}
              </button>
            ))}
          </div>
          {onClearHistory ? (
            <button
              type="button"
              className="mt-1 rounded-[9px] px-3 py-2 text-caption font-semibold text-accent hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              onClick={onClearHistory}
            >
              Clear history
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
