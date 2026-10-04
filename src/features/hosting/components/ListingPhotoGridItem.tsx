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
      className={`group relative aspect-[4/3] overflow-hidden rounded-cut-md border bg-surface-soft ${
        isSelected ? "border-accent ring-2 ring-accent" : "border-line"
      }`}
    >
      <NetworkImage
        alt={`Photo ${index + 1}`}
        src={url}
        wrapperClassName="h-full w-full rounded-cut-md"
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
            className={`relative flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors before:absolute before:-inset-2.5 before:content-[''] ${
              isSelected
                ? "border-accent bg-accent text-on-clay"
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
          className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center rounded-full text-white transition-opacity before:absolute before:inset-2 before:-z-10 before:rounded-full before:bg-scrim/70 before:content-[''] disabled:opacity-40 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
          aria-label={`Remove photo ${index + 1}`}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
      {/* Set-as-main button (hidden when already main) */}
      {!multiSelect && index !== 0 ? (
        <button
          type="button"
          onClick={onSetMain}
          disabled={setMainDisabled}
          className="absolute bottom-1 right-1 min-h-11 rounded-cut-sm bg-surface px-3 text-label-md text-accent shadow-sm transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100 hover:bg-paper-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
        >
          Set main
        </button>
      ) : null}
      {/* Main badge */}
      {index === 0 ? (
        <span className="absolute bottom-2 left-2 rounded-cut-sm bg-clay px-2 py-0.5 text-label-md text-on-clay">
          Main
        </span>
      ) : null}
    </div>
  );
}
