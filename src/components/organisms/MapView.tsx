import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import { useStore } from "zustand";
import { uiStore } from "@/lib/stores/ui-store";
import type { MapCluster, MapPin } from "@/lib/api/types";
import type { MapBounds } from "@/lib/stores/map-store";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { cn } from "../ui/component-utils";
import { Spinner } from "../ui/Spinner";
import { MapZoomControls } from "../molecules/MapZoomControls";
import "leaflet/dist/leaflet.css";

// ── Props ──────────────────────────────────────────────────────

export interface MapViewProps {
  /** Cluster data from the API */
  clusters: MapCluster[];
  /** Individual pin data from the API */
  pins: MapPin[];
  /** Active filter labels displayed as chips */
  filters?: string[];
  /** Initial map center [lat, lng] */
  center?: [number, number];
  /** Initial zoom level */
  zoom?: number;
  /** Called when a pin is clicked */
  onPinClick?: (pinId: number) => void;
  /** Called when a pin is selected (shows detail card, does not navigate) */
  onPinSelect?: (pin: MapPin) => void;
  /** Called when a cluster is clicked (map will also zoom in automatically) */
  onClusterClick?: (cluster: MapCluster) => void;
  /** Called when filters button is clicked */
  onFilterClick?: () => void;
  /** Called when the map viewport changes (pan/zoom) */
  onViewportChange?: (bounds: MapBounds, zoom: number) => void;
  /** Called when the locate-me button is clicked */
  onLocate?: () => void;
  /** True while viewport listings are being (re)fetched; shows a non-blocking indicator */
  isFetching?: boolean;
  /** HTML class overrides */
  className?: string;
}

// ── Default center: New Delhi (matches map-store) ──────────────

import { DEFAULT_CENTER as DEFAULT_CENTER_OBJECT } from "@/lib/stores/map-store";
const DEFAULT_CENTER: [number, number] = [DEFAULT_CENTER_OBJECT.lat, DEFAULT_CENTER_OBJECT.lng];
const DEFAULT_ZOOM = 12;

// ── Custom Leaflet icons ───────────────────────────────────────

function formatRent(rent?: number): string {
  if (rent === undefined) return "₹--";
  if (rent >= 100000) {
    const l = rent / 100000;
    return `₹${rent % 100000 !== 0 ? l.toFixed(1) : l.toFixed(0)}L`;
  }
  if (rent >= 1000) {
    const k = rent / 1000;
    return `₹${rent % 1000 !== 0 ? k.toFixed(1) : k.toFixed(0)}k`;
  }
  return `₹${rent}`;
}

function createPinIcon(pin: MapPin): L.DivIcon {
  const isCoHunter = pin.mode === "co_hunter";
  const labelText = isCoHunter ? "Flatmate" : formatRent(pin.monthly_rent);

  const html = isCoHunter
    ? `
      <div class="map-hunter-badge" data-pin-id="${pin.id}" role="button" tabindex="0" aria-label="Flatmate profile pin" style="
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-surface);
        border: 1.5px solid var(--color-teal-mid);
        color: var(--color-ink);
        font-family: var(--font-inter, Inter, sans-serif);
        font-size: 11px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 9999px;
        box-shadow: var(--shadow-sm);
        white-space: nowrap;
        cursor: pointer;
        transition: all 120ms cubic-bezier(0.4, 0, 0.2, 1);
        gap: 4px;
      ">
        <span style="font-size: 10px;">👤</span>
        <span>Flatmate</span>
      </div>
    `
    : `
      <div class="map-rent-badge" data-pin-id="${pin.id}" role="button" tabindex="0" aria-label="Rent property pin: ${labelText}" style="
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-surface);
        border: 1.5px solid var(--color-accent);
        color: var(--color-ink);
        font-family: var(--font-inter, Inter, sans-serif);
        font-size: 11px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 9999px;
        box-shadow: var(--shadow-sm);
        white-space: nowrap;
        cursor: pointer;
        transition: all 120ms cubic-bezier(0.4, 0, 0.2, 1);
      ">
        ${labelText}
      </div>
    `;

  const width = isCoHunter ? 72 : 52;
  const height = 24;

  return L.divIcon({
    html,
    className: "",
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2]
  });
}

function createClusterIcon(cluster: MapCluster): L.DivIcon {
  const count = cluster.count;
  const breakdown = cluster.type_breakdown;
  const hasRooms = (breakdown?.room_available ?? 0) > 0;
  const hasHunters = (breakdown?.co_hunter ?? 0) > 0;

  let accentColor = "var(--color-accent)";
  let bgColor = "var(--color-accent-container)";

  if (hasRooms && hasHunters) {
    accentColor = "var(--color-warning)";
    bgColor = "var(--color-warning-soft)";
  } else if (hasHunters && !hasRooms) {
    accentColor = "var(--color-teal-mid)";
    bgColor = "var(--color-teal-soft)";
  }

  const inkColor = "var(--color-ink)";
  const shadowSm = "var(--shadow-sm)";
  const fontSize = count >= 100 ? "13px" : count >= 10 ? "12px" : "11px";

  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    ">
      <div role="button" tabindex="0" data-cluster-id="${cluster.id}" aria-label="Listing cluster: ${count} items" style="
        background: ${bgColor};
        border: 2.5px solid ${accentColor};
        border-radius: 50%;
        width: ${count >= 100 ? 48 : count >= 10 ? 40 : 32}px;
        height: ${count >= 100 ? 48 : count >= 10 ? 40 : 32}px;
        font-family: var(--font-inter, Inter, system-ui, sans-serif);
        font-size: ${fontSize};
        font-weight: 700;
        color: ${inkColor};
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: ${shadowSm};
        cursor: pointer;
        transition: transform 150ms ease-out, box-shadow 150ms ease-out;
      ">
        ${count}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "map-cluster-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
}

// ── Map event handler component ────────────────────────────────

function MapEventHandler({
  onViewportChange
}: {
  onViewportChange?: (bounds: MapBounds, zoom: number) => void;
}) {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending debounce timer on unmount so a fired callback can't run
  // against a torn-down map (avoids a setState-after-unmount / stale-closure leak).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useMapEvents({
    moveend: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        onViewportChange?.(
          {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          },
          zoom
        );
      }, 300);
    }
  });

  return null;
}

// ── Leaflet-aware zoom control wrapper ────────────────────────────

function LeafletZoomControls({
  onLocate
}: {
  onLocate?: () => void;
}) {
  const map = useMap();

  return (
    <MapZoomControls
      onZoomIn={() => map.zoomIn()}
      onZoomOut={() => map.zoomOut()}
      onLocate={onLocate}
    />
  );
}

// ── Fly-to controller: zooms into a cluster on click ───────────

function MapFlyTo({ target }: { target: { lat: number; lng: number; zoom: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    // Honor reduced-motion: jump instead of animating the fly-to.
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      map.setView([target.lat, target.lng], target.zoom, { animate: false });
    } else {
      map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.5 });
    }
  }, [target, map]);

  return null;
}

// ── Main MapView Component ─────────────────────────────────────

export function MapView({
  clusters,
  pins,
  filters = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onPinClick,
  onPinSelect,
  onClusterClick,
  onFilterClick,
  onViewportChange,
  onLocate,
  isFetching = false,
  className
}: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [hasEverLoaded, setHasEverLoaded] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  // SSR guard: Leaflet requires window, so we defer rendering until client hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsMounted(true); }, []);

  const theme = useStore(uiStore, (s) => s.theme);
  const [systemDark, setSystemDark] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Track the OS color-scheme so "system" theme swaps tiles live when the OS flips.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && systemDark);

  const tileUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  // Memoize icons to avoid re-creation on every render
  const pinIconMap = useMemo(() => {
    const map = new Map<number, L.DivIcon>();
    for (const pin of pins) {
      map.set(pin.id, createPinIcon(pin));
    }
    return map;
  }, [pins]);

  const clusterIconMap = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const cluster of clusters) {
      map.set(cluster.id, createClusterIcon(cluster));
    }
    return map;
  }, [clusters]);

  const totalCount = useMemo(
    () => pins.length + clusters.reduce((sum, c) => sum + c.count, 0),
    [pins, clusters]
  );

  // Track whether data has ever been loaded to avoid flashing the empty overlay
  // during initial load before the first query resolves.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (totalCount > 0) setHasEverLoaded(true); }, [totalCount]);

  const handlePinClick = useCallback(
    (pin: MapPin) => {
      onPinSelect?.(pin);
      onPinClick?.(pin.id);
    },
    [onPinClick, onPinSelect]
  );

  const handleClusterClick = useCallback(
    (cluster: MapCluster) => {
      // Zoom into the cluster area
      setFlyToTarget({ lat: cluster.lat, lng: cluster.lng, zoom: 15 });
      onClusterClick?.(cluster);
    },
    [onClusterClick]
  );

  /* ----- Keyboard a11y: activate cluster/pin with Enter/Space -----
   * Leaflet divIcons are mounted outside React's render tree, so React's
   * synthetic onKeyDown doesn't reach them. We delegate via a single
   * container-level keydown listener that checks for our `data-*` hooks
   * added in the icon HTML and forwards Enter / Space as a click. */
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const active = document.activeElement as HTMLElement | null;
      if (!active || !root.contains(active)) return;
      const clusterId = active.getAttribute("data-cluster-id");
      const pinId = active.getAttribute("data-pin-id");
      if (clusterId !== null) {
        event.preventDefault();
        const cluster = clusters.find((c) => c.id === clusterId);
        if (cluster) handleClusterClick(cluster);
        return;
      }
      if (pinId !== null) {
        event.preventDefault();
        const numericId = Number(pinId);
        const pin = pins.find((p) => p.id === numericId);
        if (pin) handlePinClick(pin);
      }
    };
    root.addEventListener("keydown", handleKeyDown);
    return () => root.removeEventListener("keydown", handleKeyDown);
  }, [clusters, pins, handleClusterClick, handlePinClick]);

  if (!isMounted) {
    return (
      <section
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden bg-paper-2",
          className
        )}
      >
        <div className="flex flex-1 items-center justify-center">
          <Spinner size="md" />
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative flex flex-1 flex-col overflow-hidden bg-paper-2",
        className
      )}
    >
      {/* Hover styles for premium map pin badges + theme transition */}
      <style>{`
        .leaflet-marker-icon:hover .map-rent-badge {
          transform: scale(1.08);
          background-color: var(--color-accent) !important;
          border-color: var(--color-accent) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px var(--color-accent-soft);
        }
        .leaflet-marker-icon:hover .map-hunter-badge {
          transform: scale(1.08);
          background-color: var(--color-teal-mid) !important;
          border-color: var(--color-teal-mid) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px var(--color-teal-soft);
        }
        /* Smooth tile fade-in when the theme flips and the TileLayer remounts.
           Without this, the dark↔light switch flashes a blank background while
           new tiles load. */
        .leaflet-tile-pane {
          animation: leaflet-tile-fade-in 240ms ease-out;
        }
        @keyframes leaflet-tile-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Filter bar */}
      <div className="z-[1000] flex min-h-12 md:min-h-14 items-center gap-2 border-b border-line bg-surface px-2 sm:px-3">
        <div className="flex flex-1 gap-1.5 sm:gap-2 overflow-x-auto scrollbar-thin">
          {filters.map((filter) => (
            <Chip key={filter} selected variant="filter">
              {filter}
            </Chip>
          ))}
        </div>
        <Button
          leadingIcon={
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          }
          size="compact"
          variant="secondary"
          aria-label="Filters"
          onClick={onFilterClick}
        >
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Map */}
      <div ref={containerRef} className="relative flex-1">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          aria-label="Map of listings in the current area"
          zoomControl={false}
          attributionControl={true}
          scrollWheelZoom={true}
          style={{ height: "100%" }}
        >
          <TileLayer
            key={tileUrl}
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={tileUrl}
          />
          <MapEventHandler onViewportChange={onViewportChange} />
          <LeafletZoomControls onLocate={onLocate} />
          <MapFlyTo target={flyToTarget} />

          {/* Cluster markers */}
          {clusters.map((cluster) => (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[cluster.lat, cluster.lng]}
              icon={clusterIconMap.get(cluster.id)!}
              eventHandlers={{
                click: () => handleClusterClick(cluster)
              }}
            />
          ))}

          {/* Pin markers */}
          {pins.map((pin) => (
            <Marker
              key={`pin-${pin.id}`}
              position={[pin.lat, pin.lng]}
              icon={pinIconMap.get(pin.id)!}
              eventHandlers={{
                click: () => handlePinClick(pin)
              }}
            />
          ))}
        </MapContainer>

        {/* Pin count badge */}
        <div className="absolute left-3 top-3 z-[1000] rounded-full bg-surface px-2.5 py-1 sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 text-caption font-semibold text-ink shadow-sm">
          {totalCount} {totalCount === 1 ? "listing" : "listings"}
        </div>

        {/* Non-blocking refetch indicator (smooth pan/zoom: pins stay visible) */}
        {isFetching ? (
          <div
            aria-live="polite"
            className="absolute right-3 top-3 z-[1000] flex items-center gap-2 rounded-full bg-surface px-2.5 py-1 sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 text-caption font-semibold text-ink-2 shadow-sm"
          >
            <span aria-hidden="true" className="contents">
              <Spinner size="sm" />
            </span>
            <span>Updating…</span>
          </div>
        ) : null}

        {/* Empty: no listings in this viewport (overlay, map stays interactive) */}
        {!isFetching && totalCount === 0 && hasEverLoaded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 z-[1000] flex justify-center px-4">
            <p className="rounded-full bg-surface px-4 py-2 text-center text-caption font-medium text-ink-2 shadow-md">
              No listings in this area. Pan or zoom out to explore nearby.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
