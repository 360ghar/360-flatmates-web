import { X } from "lucide-react";

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
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-eyebrow uppercase tracking-widest text-ink-3">Recent:</span>
      {recentSearches.map((term) => (
        <button
          key={term}
          type="button"
          onClick={() => onSelectTerm(term)}
          className="rounded-full border border-line bg-surface px-3 py-1 text-body-sm text-ink-2 transition-colors hover:border-accent/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {term}
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear recent searches"
        className="ml-1 inline-flex items-center gap-1 text-body-sm text-ink-3 transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
        Clear
      </button>
    </div>
  );
}
