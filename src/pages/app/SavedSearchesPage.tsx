import { Trash2, Search, Bookmark, Pencil, Copy, Bell, Check, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useCallback } from "react";
import {
  useSavedSearches,
  useDeleteSavedSearch,
  useCreateSavedSearch
} from "@/hooks/queries";
import { humanizeSnakeCase, toTitleCase } from "@/lib/utils/format";
import { uiStore } from "@/lib/stores/ui-store";
import type { SearchFilters } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";

/** Serialize all SearchFilters fields into URL search params. */
function filtersToSearchParams(filters: SearchFilters): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.search_type) params.set("search_type", filters.search_type);
  if (filters.lat !== undefined) params.set("lat", String(filters.lat));
  if (filters.lng !== undefined) params.set("lng", String(filters.lng));
  if (filters.radius !== undefined) params.set("radius", String(filters.radius));
  if (filters.property_type && filters.property_type.length > 0) {
    params.set("property_type", filters.property_type.join(","));
  }
  if (filters.purpose) params.set("purpose", filters.purpose);
  if (filters.city) params.set("city", filters.city);
  if (filters.locality) params.set("locality", filters.locality);
  if (filters.sub_locality) params.set("sub_locality", filters.sub_locality);
  if (filters.price_min !== undefined) params.set("priceMin", String(filters.price_min));
  if (filters.price_max !== undefined) params.set("priceMax", String(filters.price_max));
  if (filters.bedrooms_min !== undefined) params.set("bedrooms_min", String(filters.bedrooms_min));
  if (filters.bedrooms_max !== undefined) params.set("bedrooms_max", String(filters.bedrooms_max));
  if (filters.sharing_type && filters.sharing_type.length > 0) {
    params.set("sharing_type", filters.sharing_type.join(","));
  }
  if (filters.gender_preference && filters.gender_preference.length > 0) {
    params.set("gender_preference", filters.gender_preference.join(","));
  }
  if (filters.move_in && filters.move_in.length > 0) {
    params.set("move_in", filters.move_in.join(","));
  }
  if (filters.available_from) params.set("available_from", filters.available_from);
  if (filters.amenities && filters.amenities.length > 0) {
    params.set("amenities", filters.amenities.join(","));
  }
  if (filters.features && filters.features.length > 0) {
    params.set("features", filters.features.join(","));
  }
  if (filters.society_type) params.set("society_type", filters.society_type);
  if (filters.society_vibe_tags && filters.society_vibe_tags.length > 0) {
    params.set("society_vibe_tags", filters.society_vibe_tags.join(","));
  }
  if (filters.sort_by) params.set("sort_by", filters.sort_by);
  if (filters.semantic_search !== undefined) {
    params.set("semantic_search", String(filters.semantic_search));
  }
  if (filters.exclude_swiped !== undefined) {
    params.set("exclude_swiped", String(filters.exclude_swiped));
  }
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Render a single filter value as a human-readable chip. */
function formatFilterValue(key: string, value: unknown): string {
  const humanKey = toTitleCase(humanizeSnakeCase(key));
  if (Array.isArray(value)) {
    if (value.length === 0) return humanKey;
    const items = value.map((v) => toTitleCase(humanizeSnakeCase(String(v)))).join(", ");
    return `${humanKey}: ${items}`;
  }
  if (typeof value === "number") {
    return `${humanKey}: ${value}`;
  }
  if (typeof value === "boolean") {
    return `${humanKey}: ${value ? "yes" : "no"}`;
  }
  const str = String(value ?? "").trim();
  if (!str) return humanKey;
  return `${humanKey}: ${str}`;
}

export function SavedSearchesPage() {
  const navigate = useNavigate();
  const { data: savedSearches, isLoading, error, refetch } = useSavedSearches();
  const deleteSavedSearch = useDeleteSavedSearch();
  const createSavedSearch = useCreateSavedSearch();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const confirmTarget = savedSearches?.find((s) => s.id === confirmDeleteId) ?? null;

  // Inline rename state — a TODO marks the missing hook. The UI is in place so
  // that wiring up useUpdateSavedSearch (in src/hooks/queries/useSearch.ts,
  // outside this fix's scope) is the only follow-up.
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // TODO(rename): add a useUpdateSavedSearch hook in
  // src/hooks/queries/useSearch.ts to back the inline rename. The hook does
  // not exist yet, so the commit handler below is a no-op placeholder that
  // just dismisses the editor and shows a friendly toast. Once the hook is
  // added, replace the body of commitRename with a useUpdateSavedSearch.mutate
  // call (mirroring useDeleteSavedSearch).

  const beginRename = useCallback((id: number, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  }, []);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId === null) return;
    const trimmed = renameValue.trim();
    cancelRename();
    if (!trimmed) return;
    const target = savedSearches?.find((s) => s.id === renamingId);
    if (!target || target.name === trimmed) return;
    uiStore.getState().pushToast({
      type: "info",
      title: "Rename is not yet available",
      description: "Use Duplicate to clone the search under a new name.",
    });
  }, [renamingId, renameValue, savedSearches, cancelRename]);

  const handleClone = useCallback(
    (id: number) => {
      const target = savedSearches?.find((s) => s.id === id);
      if (!target) return;
      const clonedName = `${target.name} (Copy)`;
      createSavedSearch.mutate(
        {
          name: clonedName,
          filters: target.filters,
          alert_enabled: false
        },
        {
          onSuccess: () => {
            uiStore.getState().pushToast({
              type: "success",
              title: "Saved search duplicated"
            });
          },
          onError: () => {
            uiStore.getState().pushToast({
              type: "error",
              title: "Could not duplicate saved search"
            });
          }
        }
      );
    },
    [savedSearches, createSavedSearch]
  );

  const handleSaveAsAlert = useCallback(
    (filters: SearchFilters) => {
      const params = new URLSearchParams();
      params.set("seedOpen", "1");
      if (filters.city) params.set("seedCity", filters.city);
      if (filters.locality) params.set("seedLocality", filters.locality);
      if (filters.price_min !== undefined) {
        params.set("seedPriceMin", String(filters.price_min));
      }
      if (filters.price_max !== undefined) {
        params.set("seedPriceMax", String(filters.price_max));
      }
      navigate(`/alerts?${params.toString()}`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    (id: number) => {
      setPendingDeleteId(id);
      deleteSavedSearch.mutate(id, {
        onSuccess: () => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Saved search deleted"
          });
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not delete saved search"
          });
        },
        onSettled: () => {
          setPendingDeleteId(null);
          setConfirmDeleteId(null);
        }
      });
    },
    [deleteSavedSearch]
  );

  const handleRerun = useCallback(
    (filters: SearchFilters) => {
      navigate(`/search${filtersToSearchParams(filters)}`);
    },
    [navigate]
  );

  // TODO(edit-filters): Add an "Edit filters" action that opens a re-filter
  // modal pre-populated from the saved search. This requires reusing the
  // search filter panel and a PATCH on the saved-search endpoint with the
  // new filters object. Tracked for a follow-up.

  return (
    <div className="flex flex-col gap-5 page-fade">
      <h1 className="text-h1">Saved Searches</h1>

      <AsyncView
        data={savedSearches ?? []}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={
          <div className="flex flex-col gap-3" aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Skeleton className="h-6 w-14 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-12 rounded-full" />
                  </div>
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-9 rounded-[9px]" />
                  <Skeleton className="h-9 w-9 rounded-[9px]" />
                </div>
              </div>
            ))}
          </div>
        }
        errorView={
          <Card className="flex items-center justify-center p-8">
            <EmptyState
              title="No saved searches yet"
              description="Save a search from the search results page to revisit it later."
              icon={<Bookmark aria-hidden="true" className="h-6 w-6" />}
              actionLabel="Start searching"
              onAction={() => navigate("/search")}
            />
          </Card>
        }
        empty={
          <EmptyState
            title="No saved searches yet"
            description="Save a search from the search results page to revisit it later."
            icon={<Bookmark aria-hidden="true" className="h-6 w-6" />}
            actionLabel="Start searching"
            onAction={() => navigate("/search")}
          />
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <div className="flex flex-col gap-3" role="list" aria-label="Saved searches">
            {data.map((search) => {
              const activeFilters = Object.entries(search.filters)
                .filter(([, value]) => {
                  if (value === undefined || value === null || value === "") return false;
                  if (Array.isArray(value) && value.length === 0) return false;
                  return true;
                })
                .map(([key, value]) => formatFilterValue(key, value));
              const isRenaming = renamingId === search.id;

              return (
                <Card key={search.id} className="flex items-center justify-between gap-4 p-4" role="listitem">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isRenaming ? (
                        <Input
                          aria-label={`Rename saved search ${search.name}`}
                          value={renameValue}
                          autoFocus
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              commitRename();
                            } else if (e.key === "Escape") {
                              e.preventDefault();
                              cancelRename();
                            }
                          }}
                          onBlur={commitRename}
                          className="max-w-xs"
                        />
                      ) : (
                        <>
                          <h2 className="text-body-md font-semibold text-ink truncate">{search.name}</h2>
                          {search.alert_enabled && (
                            <Chip variant="info" selected>Alert On</Chip>
                          )}
                        </>
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
                    {isRenaming ? (
                      <>
                        <Button
                          variant="icon"
                          size="icon"
                          aria-label="Confirm rename"
                          onClick={commitRename}
                        >
                          <Check aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="icon"
                          size="icon"
                          aria-label="Cancel rename"
                          onClick={cancelRename}
                        >
                          <X aria-hidden="true" className="h-4 w-4 text-ink-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="icon"
                          size="icon"
                          aria-label={`Run search: ${search.name}`}
                          onClick={() => handleRerun(search.filters)}
                        >
                          <Search aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="icon"
                          size="icon"
                          aria-label={`Rename saved search: ${search.name}`}
                          onClick={() => beginRename(search.id, search.name)}
                        >
                          <Pencil aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="icon"
                          size="icon"
                          aria-label={`Duplicate saved search: ${search.name}`}
                          onClick={() => handleClone(search.id)}
                          loading={createSavedSearch.isPending}
                        >
                          <Copy aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="icon"
                          size="icon"
                          aria-label={`Create alert from saved search: ${search.name}`}
                          onClick={() => handleSaveAsAlert(search.filters)}
                        >
                          <Bell aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="icon"
                          size="icon"
                          aria-label={`Delete saved search: ${search.name}`}
                          onClick={() => setConfirmDeleteId(search.id)}
                          loading={deleteSavedSearch.isPending && pendingDeleteId === search.id}
                        >
                          <Trash2 aria-hidden="true" className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </AsyncView>

      {/* Delete confirmation modal */}
      <Modal
        open={confirmDeleteId !== null}
        title="Delete saved search?"
        description={confirmTarget ? `"${confirmTarget.name}" will be permanently removed. This cannot be undone.` : "This saved search will be permanently removed."}
        onClose={() => setConfirmDeleteId(null)}
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirmDeleteId(null)}>
              Keep it
            </Button>
            <Button
              className="bg-error text-white shadow-none hover:bg-error/90"
              loading={deleteSavedSearch.isPending}
              onClick={() => {
                if (confirmDeleteId !== null) handleDelete(confirmDeleteId);
              }}
            >
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
}
