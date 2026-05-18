import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
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
  /** HTML class overrides */
  className?: string;
}

// ── Default center: New Delhi (matches map-store) ──────────────

import { DEFAULT_CENTER as DEFAULT_CENTER_OBJECT } from "@/lib/stores/map-store";
const DEFAULT_CENTER: [number, number] = [DEFAULT_CENTER_OBJECT.lat, DEFAULT_CENTER_OBJECT.lng];
const DEFAULT_ZOOM = 12;

// ── Cached design-token reader for Leaflet icon HTML ────────────────

const cssVarCache = new Map<string, string>();

function getCSSVar(name: string): string {
  const cached = cssVarCache.get(name);
  if (cached !== undefined) return cached;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  cssVarCache.set(name, value);
  return value;
}

function invalidateCSSVarCache() {
  cssVarCache.clear();
}



// ── Custom Leaflet icons ───────────────────────────────────────

function createPinIcon(pin: MapPin): L.DivIcon {
  const isCoHunter = pin.mode === "co_hunter";
  const dotColor = isCoHunter ? "#5A9DA8" : "#C96442";
  const ringColor = isCoHunter ? "#CFE4DF" : "#F8D5C8";

  const html = `
    <div style="
      width: 14px;
      height: 14px;
      background: ${dotColor};
      border: 2.5px solid ${ringColor};
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(31,26,20,0.15);
      transition: transform 150ms ease-out, box-shadow 150ms ease-out;
      cursor: pointer;
    "></div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

function createClusterIcon(cluster: MapCluster): L.DivIcon {
  const count = cluster.count;
  const breakdown = cluster.type_breakdown;
  const hasRooms = (breakdown?.room_available ?? 0) > 0;
  const hasHunters = (breakdown?.co_hunter ?? 0) > 0;

  let accentColor = getCSSVar("--color-accent");
  let bgColor = getCSSVar("--color-accent-container");

  if (hasRooms && hasHunters) {
    accentColor = getCSSVar("--color-warning");
    bgColor = getCSSVar("--color-warning-soft");
  } else if (hasHunters && !hasRooms) {
    accentColor = getCSSVar("--color-teal-mid");
    bgColor = getCSSVar("--color-teal-soft");
  }

  const inkColor = getCSSVar("--color-ink");
  const shadowSm = `0 2px 6px ${getCSSVar("--color-line")}`;
  const fontSize = count >= 100 ? "13px" : count >= 10 ? "12px" : "11px";

  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    ">
      <div style="
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
    className: "",
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
      }, 150);
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
    if (target) {
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
  className
}: MapViewProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  } | null>(null);

  // SSR guard: Leaflet requires window, so we defer rendering until client hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setIsMounted(true); }, []);

  // Invalidate CSS variable cache when theme changes
  useEffect(() => {
    const observer = new MutationObserver(invalidateCSSVarCache);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette"],
    });
    return () => observer.disconnect();
  }, []);

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
      {/* Hover style for pin dot markers */}
      <style>{`
        .leaflet-marker-icon:hover > div > div {
          transform: scale(1.3);
          box-shadow: 0 3px 10px rgba(31,26,20,0.25);
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
          onClick={onFilterClick}
        >
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={true}
          scrollWheelZoom={true}
          style={{ height: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
          {pins.length + clusters.reduce((sum, c) => sum + c.count, 0)} listings
        </div>
      </div>
    </section>
  );
}
