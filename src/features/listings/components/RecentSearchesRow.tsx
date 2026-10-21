import { X } from "lucide-react";
import { cn, focusRing } from "@/components/ui/component-utils";

const quiet = cn("inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-cut-md px-2.5 text-body-md text-ink-2 hover:bg-surface-soft hover:text-ink", focusRing);

/** The last few searches as one sideways-scrolling line. */
export function RecentSearchesRow({
  recentSearches,
  onSelectTerm,
  onClear
}: {
  recentSearches: string[];
  onSelectTerm: (term: string) => void;
  onClear: () => void;
}) {
  if (recentSearches.length === 0) return null;

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
      <span className="mr-1 shrink-0 text-body-md text-ink-3">Recent</span>
      {recentSearches.map((term) => (
        <button key={term} type="button" onClick={() => onSelectTerm(term)} className={quiet}>
          {term}
        </button>
      ))}
      <button type="button" onClick={onClear} aria-label="Clear recent searches" className={cn(quiet, "text-ink-3")}>
        <X className="h-4 w-4" aria-hidden="true" />
        Clear
      </button>
    </div>
  );
}
