import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from "react-leaflet";
import type L from "leaflet";
import type { MapCluster, MapPin } from "@/lib/api/types";
import type { MapBounds } from "@/features/explore/store";
import { cn } from "@/components/ui/component-utils";
import { createClusterIcon, createPinIcon } from "@/features/explore/lib/map-icons";
import { MapFilterBar, MapZoomControls } from "./MapControls";
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

import { DEFAULT_CENTER as DEFAULT_CENTER_OBJECT } from "@/features/explore/store";
const DEFAULT_CENTER: [number, number] = [DEFAULT_CENTER_OBJECT.lat, DEFAULT_CENTER_OBJECT.lng];
const DEFAULT_ZOOM = 12;

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

// ── Center/zoom sync: MapContainer only reads center/zoom on mount, so an
//   external change (locate-me, profile-city seed) needs an explicit setView.
//   Same reduced-motion rule as the cluster fly-to above.
function MapCenterSync({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const mountedRef = useRef(false);

  useEffect(() => {
    // Mount is already correct: MapContainer initialised from these props.
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      map.setView(center, zoom, { animate: false });
    } else {
      map.flyTo(center, zoom, { duration: 0.5 });
    }
    // Compare by value: the parent builds a fresh tuple every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, center[0], center[1], zoom]);

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
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  // Night styling is a CSS filter on the tile pane (globals.css), so one tile set serves both themes.
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution =
    import.meta.env.VITE_MAP_TILE_ATTRIBUTION ||
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
  const handleContainerKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const root = containerRef.current;
    if (!root) return;
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
  });
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root.addEventListener("keydown", handleContainerKeyDown);
    return () => root.removeEventListener("keydown", handleContainerKeyDown);
  }, []);

  return (
    <section
      className={cn(
        "relative flex flex-1 flex-col overflow-hidden bg-surface-soft",
        className
      )}
    >

      <MapFilterBar filters={filters} onFilterClick={onFilterClick} />

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
          <TileLayer attribution={attribution} url={tileUrl} />
          <MapEventHandler onViewportChange={onViewportChange} />
          <MapZoomControls onLocate={onLocate} />
          <MapFlyTo target={flyToTarget} />
          <MapCenterSync center={center} zoom={zoom} />

          {/* Cluster markers */}
          {clusters.map((cluster) => (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[cluster.lat, cluster.lng]}
              icon={clusterIconMap.get(cluster.id)!}
              // The tag inside the icon is the button; a focusable Leaflet wrapper would nest two.
              keyboard={false}
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
              keyboard={false}
              eventHandlers={{
                click: () => handlePinClick(pin)
              }}
            />
          ))}
        </MapContainer>

        <p className="paper-grain pointer-events-none absolute left-3 top-3 z-[1000] rounded-cut-md bg-paper-3 px-3 py-1.5 text-label-md text-ink shadow-xs sm:left-4 sm:top-4">
          <span className="tabular">{totalCount}</span> {totalCount === 1 ? "place" : "places"} in view
          {isFetching ? <span className="text-ink-3"> · updating</span> : null}
        </p>
      </div>
    </section>
  );
}
