import { userMessage } from "@/lib/api/errors";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";

import { useWebSearch } from "@/features/listings/hooks/useSearch";
import { propertyToListingCardProps } from "@/features/listings/lib/adapters";
import type { SearchFilters } from "@/lib/api/types";
import { SearchResults } from "./SearchResults";
import { type FilterSection } from "./FilterPanel";
import { type ListingCardData } from "./ListingCard";
import { SearchResultsSkeleton } from "@/features/listings/components/SearchResultsSkeleton";
import { PageBand, PageContainer } from "@/components/ui/Layout";
import { InlineError } from "@/components/ui/StateViews";
import { PaperMiniScene } from "@/components/paper/PaperScene";

export default function SemanticSearchClient() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Debounce the query so we don't fire a semantic search on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filters: SearchFilters = useMemo(
    () => ({
      q: debouncedQuery || undefined,
      semantic_search: true,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      limit: 20,
    }),
    [debouncedQuery, selectedAmenities]
  );

  const {
    data: searchResults,
    isLoading,
    isError,
    error,
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

  const band = (
    <PageBand
      title="Describe your ideal home"
      description="Type it the way you would say it, like a quiet room near Koramangala under ₹15,000 with vegetarian flatmates."
      aside={<PaperMiniScene prop="magnifier" />}
    />
  );

  if (isLoading) {
    return (
      <>
        {band}
        <PageContainer className="py-8">
          <SearchResultsSkeleton />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      {band}
      <PageContainer className="page-fade py-8">
        {isError && !searchResults ? (
          <InlineError
            title="Could not load rooms"
            description={userMessage(error, "Check your connection and try again.")}
            onRetry={() => refetch()}
          />
        ) : (
          <SearchResults
            listings={listings}
            filters={filterSections}
            resultCount={searchResults?.total ?? listings.length}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterToggle={handleFilterToggle}
            onClearFilters={handleClearFilters}
            onApplyFilters={() => refetch()}
            onSaveSearch={() => navigate("/saved-searches")}
          />
        )}
      </PageContainer>
    </>
  );
}
