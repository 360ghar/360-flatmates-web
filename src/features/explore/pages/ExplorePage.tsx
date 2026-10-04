import { uiStore } from "@/lib/stores/ui-store";
import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useMapView } from "@/features/explore/hooks/useMapView";
import { useMyProfile } from "@/hooks/queries/useProfiles";
import { useProperty } from "@/features/listings/hooks/useProperties";
import { mapStore } from "@/features/explore/store";
import type { MapCluster, MapViewFilters, MapPin as MapPinType } from "@/lib/api/types";
import { getCityCenter } from "@/lib/data";
import { ErrorState } from "@/components/ui/StateViews";
import { Button } from "@/components/ui/Button";
import { FilterPanel } from "@/features/listings/components/FilterPanel";
import { BottomSheet, Drawer } from "@/components/ui/Modal";
import { MapExploreSkeleton } from "@/features/explore/components/MapExploreSkeleton";
import { cn } from "@/components/ui/component-utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { PropertyDetailPanel } from "@/features/explore/components/PropertyDetailPanel";
import { PropertyDetailSheet } from "@/features/explore/components/PropertyDetailSheet";
import type { MapBounds } from "@/features/explore/store";
import { useExploreFilters } from "@/features/explore/hooks/useExploreFilters";

// Lazy import: Leaflet requires `window` and cannot render on the server.
const MapView = React.lazy(
  () => import("@/features/explore/components/MapView").then((mod) => ({ default: mod.MapView }))
);

const MapViewFallback = () => (
  <div className="flex h-full items-center justify-center bg-surface-soft">
    <MapExploreSkeleton className="h-full w-full" />
  </div>
);

/* Edge to edge under the top bar: undo <main>'s padding (py-6, md:py-8) and fill the rest. */
const MAP_FRAME =
  "-mx-[var(--gutter)] -my-6 h-[calc(100dvh-var(--topbar-h)-var(--bottom-nav-h)-env(safe-area-inset-bottom))] md:-my-8 md:h-[calc(100dvh-var(--topbar-h))]";

export function ExplorePage() {
  const navigate = useNavigate();
  const {
    filters,
    filterPanelOpen,
    setFilterPanelOpen,
    filterSections,
    handleFilterToggle,
    handleClearFilters,
    handleApplyFilters,
  } = useExploreFilters();

  // Selected pin for inline property card
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);

  // Fetch full details of the selected property
  const { data: fullProperty, isLoading: isPropertyLoading } = useProperty(selectedPin?.id ?? 0);

  // Map state (persisted in mapStore so viewport survives navigation)
  const mapCenter = useStore(mapStore, (s) => s.center);
  const mapZoom = useStore(mapStore, (s) => s.zoom);
  const setMapCenter = useStore(mapStore, (s) => s.setCenter);
  const setMapZoom = useStore(mapStore, (s) => s.setZoom);
  const setMapBounds = useStore(mapStore, (s) => s.setBounds);

  // Seed the map from the user's profile city once it resolves. The store
  // tracks whether the viewport has been seeded so we don't keep fighting the
  // user's manual pan/zoom on every render. Only the first resolved profile
  // triggers a seed.
  const { data: profile } = useMyProfile();
  const hasSeededCenter = useStore(mapStore, (s) => s.hasSeededCenter);
  const markCenterSeeded = useStore(mapStore, (s) => s.markCenterSeeded);
  useEffect(() => {
    if (hasSeededCenter) return;
    if (!profile?.city) return;
    const center = getCityCenter(profile.city);
    setMapCenter({ lat: center.lat, lng: center.lng });
    setMapZoom(center.defaultZoom);
    markCenterSeeded();
  }, [profile?.city, hasSeededCenter, setMapCenter, setMapZoom, markCenterSeeded]);

  // Derive [lat, lng] tuple for MapView
  const centerTuple: [number, number] = [mapCenter.lat, mapCenter.lng];

  // Map API query
  const mapFilters: MapViewFilters = useMemo(
    () => ({
      lat: mapCenter.lat,
      lng: mapCenter.lng,
      zoom_level: mapZoom,
      price_min: filters.price_min,
      price_max: filters.price_max,
      sharing_type: filters.sharing_type,
      property_type: filters.property_type,
      gender_preference: filters.gender_preference,
      move_in: filters.move_in,
      // No city/locality: the map is viewport-based (lat/lng/radius). A city
      // filter kept from Home would hide every pin once the user pans away.
      amenities: filters.amenities,
      furnishing: filters.furnishing,
      kitchen_type: filters.kitchen_type,
      ventilation_type: filters.ventilation_type,
      windows_min: filters.windows_min,
      has_lift: filters.has_lift
    }),
    [
      mapCenter.lat,
      mapCenter.lng,
      mapZoom,
      filters.price_min,
      filters.price_max,
      filters.sharing_type,
      filters.property_type,
      filters.gender_preference,
      filters.move_in,
      filters.amenities,
      filters.furnishing,
      filters.kitchen_type,
      filters.ventilation_type,
      filters.windows_min,
      filters.has_lift
    ]
  );

  const {
    data: mapData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useMapView(mapFilters);

  const activeFilters = useMemo(
    () =>
      [filters.sharing_type?.[0], filters.move_in?.[0]].filter(Boolean) as string[],
    [filters.sharing_type, filters.move_in]
  );

  // Handle map viewport changes (pan/zoom)
  const handleViewportChange = useCallback((bounds: MapBounds, zoom: number) => {
    setMapCenter({
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2,
    });
    setMapZoom(zoom);
    setMapBounds(bounds);
  }, [setMapCenter, setMapZoom, setMapBounds]);

  // Handle pin selection: toggle selected pin for inline card
  const handlePinSelect = useCallback(
    (pin: MapPinType) => {
      setSelectedPin((prev) => (prev?.id === pin.id ? null : pin));
    },
    []
  );

  // Handle cluster click: zoom into the cluster area
  const handleClusterClick = useCallback(
    (_cluster: MapCluster) => {
      // Cluster click triggers zoom-in via the map component;
      // the viewport change handler will automatically refetch
      // with updated bounds.
    },
    []
  );

  // Handle locate me
  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) {
      uiStore.getState().pushToast({ type: "info", title: "Location is not available in this browser" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setMapZoom(14);
      },
      (geoError) => {
        // Tell the user why the map did not move (W16).
        uiStore.getState().pushToast({
          type: "info",
          title: "Could not find your location",
          description:
            geoError.code === geoError.PERMISSION_DENIED
              ? "Allow location access for this site in your browser settings."
              : "Try again in a moment, or move the map yourself."
        });
      },
      { timeout: 10_000 }
    );
  }, [setMapCenter, setMapZoom]);

  // Reset scroll to top when the filter set changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [
    filters.city,
    filters.locality,
    filters.sharing_type,
    filters.move_in,
    filters.gender_preference,
    filters.property_type,
    filters.price_min,
    filters.price_max,
    filters.amenities,
    filters.furnishing,
    filters.kitchen_type,
    filters.ventilation_type,
    filters.windows_min,
    filters.has_lift
  ]);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const filterPanel = (
    <FilterPanel
      sections={filterSections}
      onFilterToggle={handleFilterToggle}
      onClear={handleClearFilters}
      onApply={handleApplyFilters}
    />
  );

  if (isLoading) {
    return (
      <div className={MAP_FRAME}>
        <MapExploreSkeleton className="h-full w-full" />
      </div>
    );
  }

  // Full-page error only when there is nothing to show. A failed refetch
  // after a pan keeps the previous pins and shows an inline strip instead.
  if (error && !mapData) {
    return (
      <div className={cn(MAP_FRAME, "grid place-items-center")}>
        <ErrorState
          title="Could not load map"
          description="Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className={cn(MAP_FRAME, "page-fade flex flex-col md:flex-row")}>
      {/* Map area - takes all available space */}
      <div id="map-container" className="relative flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<MapViewFallback />}>
          <MapView
            clusters={mapData?.clusters ?? []}
            pins={mapData?.pins ?? []}
            filters={activeFilters}
            center={centerTuple}
            zoom={mapZoom}
            isFetching={isFetching}
            onPinClick={() => {}}
            onPinSelect={handlePinSelect}
            onClusterClick={handleClusterClick}
            onViewportChange={handleViewportChange}
            onLocate={handleLocate}
            onFilterClick={() => {
              setFilterPanelOpen(true);
            }}
          />
        </Suspense>
        {/* Empty-state CTA: when the map query resolves successfully but
            there are no pins in the visible area, prompt the user to either
            widen the search radius, clear filters, or use their location. */}
        {error ? (
          <div className="pointer-events-none absolute inset-x-4 top-20 z-10 flex justify-center">
            <div role="alert" className="pointer-events-auto flex items-center gap-3 rounded-hand bg-surface-elevated paper-grain px-4 py-2 shadow-md">
              <p className="text-body-md text-ink">Could not update this area.</p>
              <Button size="compact" variant="tertiary" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          </div>
        ) : null}
        {!isLoading && !error && (mapData?.pins?.length ?? 0) === 0 && (mapData?.clusters?.length ?? 0) === 0 ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-24 z-10 flex justify-center md:inset-x-auto md:left-1/2 md:bottom-12 md:-translate-x-1/2">
            <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-3 rounded-hand bg-surface-elevated paper-grain p-4 shadow-md">
              <p className="text-center text-body-md text-ink">
                No listings in this area yet.
              </p>
              <p className="text-center text-caption text-ink-3">
                Try a wider radius, clear filters, or use your location.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="compact" variant="secondary" onClick={handleLocate}>
                  Use my location
                </Button>
                <Button size="compact" variant="tertiary" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile: selected property panel below map */}
      {selectedPin && (
        <PropertyDetailSheet
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onNavigate={navigate}
        />
      )}

      {/* Tablet & Desktop: right side panel */}
      {selectedPin && (
        <PropertyDetailPanel
          selectedPin={selectedPin}
          fullProperty={fullProperty}
          isPropertyLoading={isPropertyLoading}
          onClose={() => setSelectedPin(null)}
          onNavigate={navigate}
        />
      )}

      {/* One sheet, never two: a hidden wrapper does not hide a modal <dialog>. */}
      {isDesktop ? (
        <Drawer open={filterPanelOpen} title="Filters" side="right" onClose={() => setFilterPanelOpen(false)}>
          {filterPanel}
        </Drawer>
      ) : (
        <BottomSheet open={filterPanelOpen} title="Filters" onClose={() => setFilterPanelOpen(false)}>
          {filterPanel}
        </BottomSheet>
      )}
    </div>
  );
}
