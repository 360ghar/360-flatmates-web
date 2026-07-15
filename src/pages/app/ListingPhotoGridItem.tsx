import { X } from "lucide-react";
import { NetworkImage } from "@/components/ui/NetworkImage";

export function ListingPhotoGridItem({
  url,
  index,
  isSelected,
  multiSelect,
  removeDisabled,
  setMainDisabled,
  onToggleSelect,
  onRemove,
  onSetMain
}: {
  url: string;
  index: number;
  isSelected: boolean;
  multiSelect: boolean;
  removeDisabled: boolean;
  setMainDisabled: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onSetMain: () => void;
}) {
  return (
    <div
      className={`group relative aspect-[4/3] overflow-hidden rounded-xl border bg-paper-2 ${
        isSelected ? "border-accent ring-2 ring-accent" : "border-line"
      }`}
    >
      <NetworkImage
        alt={`Photo ${index + 1}`}
        src={url}
        wrapperClassName="h-full w-full rounded-xl"
      />
      {/* Multi-select checkbox */}
      {multiSelect ? (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-pressed={isSelected}
          aria-label={
            isSelected
              ? `Deselect photo ${index + 1}`
              : `Select photo ${index + 1}`
          }
          className="absolute inset-0 z-10 flex items-start justify-end p-2"
        >
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
              isSelected
                ? "border-accent bg-accent text-white"
                : "border-line bg-surface/80 text-ink-2"
            }`}
          >
            {isSelected ? (
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M2 7L5.5 10.5L12 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
        </button>
      ) : (
        /* Remove button (single mode) */
        <button
          type="button"
          onClick={onRemove}
          disabled={removeDisabled}
          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/60 text-paper opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-40"
          aria-label={`Remove photo ${index + 1}`}
        >
          <X aria-hidden="true" className="h-3 w-3" />
        </button>
      )}
      {/* Set-as-main button (hidden when already main) */}
      {!multiSelect && index !== 0 ? (
        <button
          type="button"
          onClick={onSetMain}
          disabled={setMainDisabled}
          className="absolute bottom-1 right-1 rounded bg-surface px-1.5 py-0.5 text-caption font-semibold text-accent shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
        >
          Set main
        </button>
      ) : null}
      {/* Main badge */}
      {index === 0 ? (
        <span className="absolute bottom-1 left-1 rounded bg-accent px-1.5 py-0.5 text-caption font-semibold text-paper">
          Main
        </span>
      ) : null}
    </div>
  );
}
