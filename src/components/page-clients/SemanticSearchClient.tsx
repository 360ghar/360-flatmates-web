import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";

import { useWebSearch } from "@/hooks/queries/useSearch";
import { propertyToListingCardProps } from "@/lib/api/adapters";
import type { SearchFilters } from "@/lib/api/types";
import { SearchResults } from "@/components/organisms/SearchResults";
import { type FilterSection } from "@/components/molecules/FilterPanel";
import { type ListingCardData } from "@/components/molecules/ListingCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/Layout";

export default function SemanticSearchClient() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const filters: SearchFilters = useMemo(
    () => ({
      q: searchQuery || undefined,
      semantic_search: true,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      limit: 20,
    }),
    [searchQuery, selectedAmenities]
  );

  const {
    data: searchResults,
    isLoading,
    refetch,
  } = useWebSearch(filters);

  const listings: ListingCardData[] = useMemo(() => {
    if (!searchResults?.results) return [];
    return searchResults.results
      .filter(
        (r): r is Extract<typeof r, { property_type: unknown }> =>
          "property_type" in (r as unknown as Record<string, unknown>)
      )
      .map((r) =>
        propertyToListingCardProps(
          r as Parameters<typeof propertyToListingCardProps>[0]
        )
      );
  }, [searchResults]);

  const filterSections: FilterSection[] = useMemo(
    () => [
      {
        id: "amenities",
        title: "Must-have amenities",
        hint: "Select amenities that are non-negotiable for you",
        options: [
          "WiFi",
          "Washing machine",
          "AC",
          "Parking",
          "Gym",
          "Power backup",
          "Cook",
          "Pets allowed",
        ].map((a) => ({
          value: a,
          label: a,
          selected: selectedAmenities.includes(a),
        })),
      },
    ],
    [selectedAmenities]
  );

  const handleFilterToggle = useCallback(
    (_sectionId: string, value: string) => {
      setSelectedAmenities((prev) =>
        prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
      );
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedAmenities([]);
  }, []);

  if (isLoading) {
    return (
      <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
        <PageHeader
          eyebrow="Semantic search"
          title="Describe your ideal home"
        />
        <Skeleton variant="searchResults" className="mt-6" />
      </main>
    );
  }

  return (
    <main id="main" className="page-fade mx-auto max-w-7xl px-5 py-8 md:px-6">
      <PageHeader
        eyebrow="Semantic search"
        title="Describe your ideal home"
        description="Type naturally: &quot;quiet room near Koramangala under 15k with vegetarian flatmates&quot; and we will find matches."
      />
      <div className="mt-6">
        <SearchResults
          listings={listings}
          filters={filterSections}
          resultCount={searchResults?.total ?? listings.length}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onFilterToggle={handleFilterToggle}
          onClearFilters={handleClearFilters}
          onApplyFilters={() => refetch()}
          onListingOpen={(id) => navigate(`/listing/${id}`)}
          onSaveSearch={() => navigate("/saved-searches")}
        />
      </div>
    </main>
  );
}
