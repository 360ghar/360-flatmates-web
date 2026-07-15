import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useCallback } from "react";
import {
  useSavedSearches,
  useDeleteSavedSearch,
  useCreateSavedSearch,
  useUpdateSavedSearch
} from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import type { SearchFilters } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { AsyncView, EmptyState, ErrorState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import { SavedSearchRow } from "./SavedSearchRow";

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

export function SavedSearchesPage() {
  const navigate = useNavigate();
  const { data: savedSearches, isLoading, error, refetch } = useSavedSearches();
  const deleteSavedSearch = useDeleteSavedSearch();
  const createSavedSearch = useCreateSavedSearch();
  const updateSavedSearch = useUpdateSavedSearch();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [pendingCloneId, setPendingCloneId] = useState<number | null>(null);

  // Confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const confirmTarget = savedSearches?.find((s) => s.id === confirmDeleteId) ?? null;

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const beginRename = useCallback((id: number, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  }, []);

  const cancelRename = useCallback(() => {
    setRenamingId(null);
    setRenameValue("");
  }, []);

  const commitRename = useCallback(() => {
    if (renamingId === null || updateSavedSearch.isPending) return;
    const trimmed = renameValue.trim();
    const target = savedSearches?.find((s) => s.id === renamingId);
    if (!trimmed || !target || target.name === trimmed) {
      cancelRename();
      return;
    }
    updateSavedSearch.mutate(
      {
        id: renamingId,
        payload: { name: trimmed }
      },
      {
        onSuccess: () => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Saved search renamed"
          });
          cancelRename();
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not rename saved search"
          });
        }
      }
    );
  }, [renamingId, renameValue, savedSearches, updateSavedSearch, cancelRename]);

  const handleClone = useCallback(
    (id: number) => {
      const target = savedSearches?.find((s) => s.id === id);
      if (!target) return;
      const clonedName = `${target.name} (Copy)`;
      setPendingCloneId(id);
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
          },
          onSettled: () => {
            setPendingCloneId(null);
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
        loading={<Skeleton variant="savedSearchCard" count={4} />}
        errorView={
          <Card className="flex items-center justify-center p-8">
            <ErrorState
              title="Could not load saved searches"
              description="Your saved searches are still here. Retry to load them again."
              actionLabel="Retry"
              onRetry={() => refetch()}
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
          <ul className="flex flex-col gap-3" aria-label="Saved searches">
            {data.map((search) => (
              <SavedSearchRow
                key={search.id}
                search={search}
                isRenaming={renamingId === search.id}
                renameValue={renameValue}
                onRenameValueChange={setRenameValue}
                onCommitRename={commitRename}
                onCancelRename={cancelRename}
                onBeginRename={beginRename}
                onRerun={handleRerun}
                onClone={handleClone}
                onSaveAsAlert={handleSaveAsAlert}
                onRequestDelete={setConfirmDeleteId}
                renamePending={updateSavedSearch.isPending}
                clonePending={createSavedSearch.isPending}
                cloneIsThisRow={pendingCloneId === search.id}
                deletePending={deleteSavedSearch.isPending}
                deleteIsThisRow={pendingDeleteId === search.id}
              />
            ))}
          </ul>
        )}
      </AsyncView>

      {/* Delete confirmation modal */}
      <Modal
        open={confirmDeleteId !== null}
        title="Delete saved search?"
        description={confirmTarget ? `"${confirmTarget.name}" will be permanently removed. This cannot be undone.` : "This saved search will be permanently removed."}
        onClose={() => {
          if (!deleteSavedSearch.isPending) setConfirmDeleteId(null);
        }}
        footer={
          <>
            <Button
              variant="tertiary"
              disabled={deleteSavedSearch.isPending}
              onClick={() => setConfirmDeleteId(null)}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
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
