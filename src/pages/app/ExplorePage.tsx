import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { useMapView, useMyProfile, useProperty } from "@/hooks/queries";
import { mapStore } from "@/lib/stores/map-store";
import type { MapCluster, MapViewFilters, MapPin as MapPinType } from "@/lib/api/types";
import { getCityCenter } from "@/lib/data";
import { ErrorState } from "@/components/ui/StateViews";
import { Button } from "@/components/ui/Button";
import { FilterPanel } from "@/components/molecules/FilterPanel";
import { BottomSheet, Drawer } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { PropertyDetailPanel } from "@/components/organisms/PropertyDetailPanel";
import { PropertyDetailSheet } from "@/components/organisms/PropertyDetailSheet";
import type { MapBounds } from "@/lib/stores/map-store";
import { useExploreFilters } from "./useExploreFilters";

// Lazy import: Leaflet requires `window` and cannot render on the server.
const MapView = React.lazy(
  () => import("@/components/organisms/MapView").then((mod) => ({ default: mod.MapView }))
);

const MapViewFallback = () => (
  <div className="flex h-full items-center justify-center bg-paper-2">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  </div>
);

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
      radius: 10,
      price_min: filters.price_min,
      price_max: filters.price_max,
      sharing_type: filters.sharing_type,
      property_type: filters.property_type,
      gender_preference: filters.gender_preference,
      move_in: filters.move_in,
      city: filters.city,
      locality: filters.locality
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
      filters.city,
      filters.locality
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
      [
        filters.city,
        filters.locality,
        filters.sharing_type?.[0],
        filters.move_in?.[0]
      ].filter(Boolean) as string[],
    [filters.city, filters.locality, filters.sharing_type, filters.move_in]
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
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setMapZoom(14);
      },
      () => {
        // On error, stay at default center
      }
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
    filters.price_max
  ]);

  if (isLoading) {
    return (
      <div className="-mx-5 -mt-6 -mb-6 h-[calc(100dvh-64px-76px-env(safe-area-inset-bottom))] md:h-[calc(100dvh-4rem)] md:-mx-6">
        <Skeleton variant="mapExplore" className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="-mx-5 -mt-6 -mb-6 flex h-[calc(100dvh-64px-76px-env(safe-area-inset-bottom))] md:h-[calc(100dvh-4rem)] items-center justify-center md:-mx-6">
        <ErrorState
          title="Could not load map"
          description="Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="-mx-5 -mt-6 -mb-11 md:-mb-6 flex h-[calc(100dvh-64px-76px-env(safe-area-inset-bottom))] md:h-[calc(100dvh-4rem)] flex-col gap-0 md:-mx-6 md:flex-row page-fade">
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
        {!isLoading && !error && (mapData?.pins?.length ?? 0) === 0 && (mapData?.clusters?.length ?? 0) === 0 ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-24 z-10 flex justify-center md:inset-x-auto md:left-1/2 md:bottom-12 md:-translate-x-1/2">
            <div className="pointer-events-auto flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-line bg-surface/95 p-4 shadow-lg backdrop-blur-md">
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

      {/* Mobile & Tablet filter panel: BottomSheet */}
      <div className="md:hidden">
        <BottomSheet
          open={filterPanelOpen}
          title="Filters"
          onClose={() => setFilterPanelOpen(false)}
        >
          <FilterPanel
            sections={filterSections}
            onFilterToggle={handleFilterToggle}
            onClear={handleClearFilters}
            onApply={handleApplyFilters}
          />
        </BottomSheet>
      </div>

      {/* Desktop filter panel: Drawer from right */}
      <div className="hidden md:block">
        <Drawer
          open={filterPanelOpen}
          title="Filters"
          side="right"
          onClose={() => setFilterPanelOpen(false)}
        >
          <FilterPanel
            sections={filterSections}
            onFilterToggle={handleFilterToggle}
            onClear={handleClearFilters}
            onApply={handleApplyFilters}
          />
        </Drawer>
      </div>
    </div>
  );
}
