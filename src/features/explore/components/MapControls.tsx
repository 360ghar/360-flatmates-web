import { LocateFixed, Minus, Plus, SlidersHorizontal } from "lucide-react";
import { useMap } from "react-leaflet";
import { Button } from "@/components/ui/Button";

/** The strip above the map: what is filtered, and the Filters button. */
export function MapFilterBar({ filters, onFilterClick }: { filters: string[]; onFilterClick?: () => void }) {
  return (
    <div className="paper-grain z-[1000] flex min-h-14 items-center gap-3 bg-surface px-[var(--gutter)] shadow-[0_1px_0_var(--color-edge)]">
      <p className="min-w-0 flex-1 truncate text-body-md text-ink-2">
        {filters.length ? (
          <>
            <span className="font-semibold text-ink">Showing: </span>
            {filters.join(", ")}
          </>
        ) : (
          "All places in view"
        )}
      </p>
      <Button
        size="compact"
        variant="secondary"
        leadingIcon={<SlidersHorizontal aria-hidden="true" className="h-4 w-4" />}
        onClick={onFilterClick}
      >
        Filters{filters.length ? ` (${filters.length})` : ""}
      </Button>
    </div>
  );
}

/** Zoom and locate, stacked in the map's corner. Must render inside <MapContainer>. */
export function MapZoomControls({ onLocate }: { onLocate?: () => void }) {
  const map = useMap();
  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <div className="paper-grain flex flex-col overflow-hidden rounded-cut-md bg-surface shadow-sm">
        <Button aria-label="Zoom in" size="icon" variant="icon" className="rounded-none" onClick={() => map.zoomIn()}>
          <Plus aria-hidden="true" className="h-5 w-5" />
        </Button>
        <Button aria-label="Zoom out" size="icon" variant="icon" className="rounded-none" onClick={() => map.zoomOut()}>
          <Minus aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      {onLocate ? (
        <Button aria-label="Show my location" size="icon" onClick={onLocate}>
          <LocateFixed aria-hidden="true" className="h-5 w-5" />
        </Button>
      ) : null}
    </div>
  );
}
