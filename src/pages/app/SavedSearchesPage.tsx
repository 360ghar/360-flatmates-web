import { Trash2, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useSavedSearches, useDeleteSavedSearch } from "@/hooks/queries";
import { humanizeSnakeCase } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { AsyncView } from "@/components/ui/StateViews";

export function SavedSearchesPage() {
  const navigate = useNavigate();
  const { data: savedSearches, isLoading, error, refetch } = useSavedSearches();
  const deleteSavedSearch = useDeleteSavedSearch();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-5 page-fade">
      <h1 className="text-h1">Saved Searches</h1>

      <AsyncView
        data={savedSearches ?? []}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="shimmer animate-shimmer motion-reduce:animate-none h-4 w-28 rounded-sm" />
                    <div className="shimmer animate-shimmer motion-reduce:animate-none h-5 w-16 rounded-full" />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <div className="shimmer animate-shimmer motion-reduce:animate-none h-6 w-14 rounded-full" />
                    <div className="shimmer animate-shimmer motion-reduce:animate-none h-6 w-16 rounded-full" />
                    <div className="shimmer animate-shimmer motion-reduce:animate-none h-6 w-12 rounded-full" />
                  </div>
                  <div className="shimmer animate-shimmer motion-reduce:animate-none mt-1 h-3 w-24 rounded-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="shimmer animate-shimmer motion-reduce:animate-none h-9 w-9 rounded-[9px]" />
                  <div className="shimmer animate-shimmer motion-reduce:animate-none h-9 w-9 rounded-[9px]" />
                </div>
              </div>
            ))}
          </div>
        }
        empty={
          <p className="py-8 text-center text-body-md text-ink-3">
            No saved searches yet. Save a search from the search results page to revisit it later.
          </p>
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.map((search) => {
              const activeFilters = Object.entries(search.filters)
                .filter(([, value]) => value !== undefined && value !== null && value !== "")
                .map(([key]) => humanizeSnakeCase(key));

              return (
                <Card key={search.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-body-md font-semibold text-ink truncate">{search.name}</h2>
                      {search.alert_enabled && (
                        <Chip variant="info" selected>Alert On</Chip>
                      )}
                    </div>
                    {activeFilters.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {activeFilters.slice(0, 3).map((filter) => (
                          <Chip key={filter} variant="info">{filter}</Chip>
                        ))}
                        {activeFilters.length > 3 && (
                          <Chip variant="info">+{activeFilters.length - 3}</Chip>
                        )}
                      </div>
                    )}
                    {search.new_results_count !== undefined && search.new_results_count > 0 && (
                      <p className="text-caption text-accent mt-1">
                        {search.new_results_count} new results
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="icon"
                      size="icon"
                      aria-label="Run search"
                      onClick={() => navigate(`/search?q=${encodeURIComponent(search.name)}`)}
                    >
                      <Search aria-hidden="true" className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="icon"
                      size="icon"
                      aria-label="Delete saved search"
                      onClick={() => {
                        setPendingDeleteId(search.id);
                        deleteSavedSearch.mutate(search.id, {
                          onSettled: () => setPendingDeleteId(null)
                        });
                      }}
                      loading={deleteSavedSearch.isPending && pendingDeleteId === search.id}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </AsyncView>
    </div>
  );
}
