import React, { Suspense, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useStore } from "zustand";
import { X, MapPin as MapPinIcon } from "lucide-react";
import { useMapView } from "@/hooks/queries";
import { searchStore } from "@/lib/stores/search-store";
import type { MapCluster, MapViewFilters, SearchFilters, MapPin as MapPinType } from "@/lib/api/types";
import {
  LISTING_SHARING_TYPE_OPTIONS,
  GENDER_PREFERENCE_VALUES,
  MOVE_IN_TIMELINE_OPTIONS,
  PROPERTY_TYPE_VALUES,
} from "@/lib/data/domain";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/StateViews";
import { FilterPanel, type FilterSection } from "@/components/molecules/FilterPanel";
import { BottomSheet, Drawer } from "@/components/ui/Modal";
import { NetworkImage } from "@/components/ui/NetworkImage";
import { PriceText } from "@/components/ui/PriceText";
import type { MapBounds } from "@/lib/stores/map-store";

// Lazy import: Leaflet requires `window` and cannot render on the server.
const MapView = React.lazy(
  () => import("@/components/organisms/MapView").then((mod) => ({ default: mod.MapView }))
);

const MapViewFallback = () => (
  <div className="flex h-full items-center justify-center bg-paper-2">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
  </div>
);

// Default center: Gurgaon (intentionally different from map-store's New Delhi default)
const DEFAULT_CENTER: [number, number] = [28.4595, 77.0266];
const DEFAULT_ZOOM = 12;

export function ExplorePage() {
  const navigate = useNavigate();
  const filters = useStore(searchStore, (s) => s.filters);
  const setFilter = useStore(searchStore, (s) => s.setFilter);
  const setFilters = useStore(searchStore, (s) => s.setFilters);
  const resetFilters = useStore(searchStore, (s) => s.resetFilters);

  // Filter panel state
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Selected pin for inline property card
  const [selectedPin, setSelectedPin] = useState<MapPinType | null>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

  // Map API query
  const mapFilters: MapViewFilters = useMemo(
    () => ({
      lat: mapCenter[0],
      lng: mapCenter[1],
      zoom_level: mapZoom,
      radius: 5,
      price_min: filters.price_min,
      price_max: filters.price_max,
      sharing_type: filters.sharing_type
    }),
    [mapCenter, mapZoom, filters.price_min, filters.price_max, filters.sharing_type]
  );

  const {
    data: mapData,
    isLoading,
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
    const newCenter: [number, number] = [
      (bounds.north + bounds.south) / 2,
      (bounds.east + bounds.west) / 2
    ];
    setMapCenter(newCenter);
    setMapZoom(zoom);
  }, []);

  // Handle pin selection: toggle selected pin for inline card
  const handlePinSelect = useCallback(
    (pin: MapPinType) => {
      setSelectedPin((prev) => (prev?.id === pin.id ? null : pin));
    },
    []
  );

  // Handle cluster click: zoom into the cluster area
  const handleClusterClick = useCallback(
    (cluster: MapCluster) => {
      void cluster;
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
        setMapCenter([position.coords.latitude, position.coords.longitude]);
        setMapZoom(14);
      },
      () => {
        // On error, stay at default center
      }
    );
  }, []);

  // Build filter sections for FilterPanel
  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        id: "property_type",
        title: "Property Type",
        options: PROPERTY_TYPE_VALUES.map((pt) => ({
          value: pt,
          label: pt === "pg" ? "PG" : "Flatmate",
          selected: filters.property_type?.includes(pt) ?? false,
        })),
      },
      {
        id: "sharing_type",
        title: "Sharing Type",
        options: LISTING_SHARING_TYPE_OPTIONS.map((st) => ({
          value: st.value,
          label: st.label,
          selected: filters.sharing_type?.includes(st.value as SearchFilters["sharing_type"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "gender_preference",
        title: "Gender Preference",
        options: GENDER_PREFERENCE_VALUES.map((gp) => ({
          value: gp,
          label: gp.charAt(0).toUpperCase() + gp.slice(1),
          selected: filters.gender_preference?.includes(gp as SearchFilters["gender_preference"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "move_in",
        title: "Move-in Timeline",
        options: MOVE_IN_TIMELINE_OPTIONS.map((mo) => ({
          value: mo.value,
          label: mo.label,
          selected: filters.move_in?.includes(mo.value as SearchFilters["move_in"] extends (infer U)[] | undefined ? U : never) ?? false,
        })),
      },
      {
        id: "budget",
        title: "Budget",
        options: [
          { value: "under5k", label: "Under ₹5,000", selected: filters.price_max !== undefined && filters.price_max <= 5000 },
          { value: "5k-10k", label: "₹5,000 – ₹10,000", selected: filters.price_min === 5000 && filters.price_max === 10000 },
          { value: "10k-20k", label: "₹10,000 – ₹20,000", selected: filters.price_min === 10000 && filters.price_max === 20000 },
          { value: "20k-30k", label: "₹20,000 – ₹30,000", selected: filters.price_min === 20000 && filters.price_max === 30000 },
          { value: "30k+", label: "₹30,000+", selected: filters.price_min === 30000 && filters.price_max === undefined },
        ],
      },
    ],
    [filters.property_type, filters.sharing_type, filters.gender_preference, filters.move_in, filters.price_min, filters.price_max]
  );

  const handleFilterToggle = useCallback(
    (sectionId: string, value: string) => {
      if (sectionId === "budget") {
        const budgetMap: Record<string, { price_min?: number; price_max?: number }> = {
          under5k: { price_max: 5000 },
          "5k-10k": { price_min: 5000, price_max: 10000 },
          "10k-20k": { price_min: 10000, price_max: 20000 },
          "20k-30k": { price_min: 20000, price_max: 30000 },
          "30k+": { price_min: 30000 },
        };
        const budget = budgetMap[value];
        if (!budget) return;
        // Toggle: if already selected with this budget, clear it
        const isSelected =
          (budget.price_min === filters.price_min || (budget.price_min === undefined && filters.price_min === undefined)) &&
          (budget.price_max === filters.price_max || (budget.price_max === undefined && filters.price_max === undefined));
        if (isSelected) {
          setFilters({ price_min: undefined, price_max: undefined });
        } else {
          setFilters({ ...budget });
        }
        return;
      }

      const currentArray = filters[sectionId as keyof SearchFilters];
      if (!Array.isArray(currentArray)) return;
      const currentStrings = currentArray as string[];
      const next = currentStrings.includes(value)
        ? currentStrings.filter((v) => v !== value)
        : [...currentStrings, value];
      setFilter(sectionId as keyof SearchFilters, next as unknown as SearchFilters[keyof SearchFilters]);
    },
    [filters, setFilter, setFilters]
  );

  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const handleApplyFilters = useCallback(() => {
    setFilterPanelOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="-mx-5 -mt-6 -mb-6 flex h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-4 md:-mx-6">
        {/* Map placeholder */}
        <div aria-hidden="true" className="h-full w-full rounded-none bg-paper-2 shimmer animate-shimmer motion-reduce:animate-none" />
        {/* Floating button placeholders */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-3">
          <div aria-hidden="true" className="h-12 w-12 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
          <div aria-hidden="true" className="h-12 w-12 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-mx-5 -mt-6 -mb-6 flex h-[calc(100dvh-4rem)] items-center justify-center md:-mx-6">
        <ErrorState
          title="Could not load map"
          description="Check your connection and try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="-mx-5 -mt-6 -mb-6 flex h-[calc(100dvh-4rem)] flex-col gap-0 md:-mx-6 md:flex-row page-fade">
      {/* Map area - takes all available space */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Suspense fallback={<MapViewFallback />}>
          <MapView
            clusters={mapData?.clusters ?? []}
            pins={mapData?.pins ?? []}
            filters={activeFilters}
            center={mapCenter}
            zoom={mapZoom}
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
      </div>

      {/* Mobile: selected property panel below map */}
      {selectedPin && (
        <div className="md:hidden max-h-[45vh] overflow-y-auto border-t border-line bg-surface p-3 sm:p-4 shadow-sm">
          <div className="flex items-start gap-3">
            {selectedPin.main_image_url && (
              <NetworkImage
                alt={selectedPin.title}
                src={selectedPin.main_image_url}
                wrapperClassName="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-xl"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <PriceText value={selectedPin.monthly_rent ?? 0} variant="hero" />
                  <h3 className="mt-0.5 line-clamp-1 text-h4 font-semibold text-ink sm:text-h3">{selectedPin.title}</h3>
                  {selectedPin.locality && (
                    <p className="mt-0.5 text-caption text-ink-3">{selectedPin.locality}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className="shrink-0 rounded-[9px] p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink"
                  onClick={() => setSelectedPin(null)}
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 sm:mt-3 flex gap-2">
                <Button
                  size="compact"
                  fullWidth
                  onClick={() => navigate(`/listing/${selectedPin.id}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tablet & Desktop: right side panel */}
      {selectedPin && (
        <div className="hidden md:flex md:w-[320px] lg:w-[380px] xl:w-[420px] shrink-0 flex-col border-l border-line bg-surface overflow-y-auto">
          <div className="p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-h3 font-semibold text-ink">Property</h2>
              <button
                type="button"
                aria-label="Close"
                className="rounded-[9px] p-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink"
                onClick={() => setSelectedPin(null)}
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
            {selectedPin.main_image_url && (
              <div className="mt-4 overflow-hidden rounded-2xl">
                <NetworkImage
                  alt={selectedPin.title}
                  src={selectedPin.main_image_url}
                  wrapperClassName="w-full aspect-[16/10] rounded-2xl"
                />
              </div>
            )}
            <div className="mt-4">
              <PriceText value={selectedPin.monthly_rent ?? 0} variant="hero" />
              <h3 className="mt-1 text-h3 font-semibold text-ink">{selectedPin.title}</h3>
              {selectedPin.locality && (
                <p className="mt-1 flex items-center gap-1.5 text-body-md text-ink-2">
                  <MapPinIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
                  <span>{selectedPin.locality}</span>
                </p>
              )}
            </div>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                fullWidth
                onClick={() => navigate(`/listing/${selectedPin.id}`)}
              >
                View Details
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigate(`/chat/new?peer=${selectedPin.id}`)}
              >
                Contact
              </Button>
            </div>
          </div>
        </div>
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
