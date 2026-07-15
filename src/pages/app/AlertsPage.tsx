import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Bell, Plus } from "lucide-react";
import {
  useSearchAlerts,
  useCreateSearchAlert,
  useUpdateSearchAlert,
  useDeleteSearchAlert
} from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { AsyncView, EmptyState, ErrorState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AlertChannel, AlertFrequency } from "@/lib/data";
import type { SearchAlertCreate, SearchFilters } from "@/lib/api/types";
import { AlertRow } from "./AlertRow";
import { AlertFormModal, type AlertFormState } from "./AlertFormModal";

const EMPTY_FORM: AlertFormState = {
  name: "",
  city: "",
  locality: "",
  priceMin: "",
  priceMax: "",
  frequency: "daily",
  channels: ["push"],
};

function buildFilters(form: AlertFormState): SearchFilters {
  const filters: SearchFilters = {};
  const city = form.city.trim();
  const locality = form.locality.trim();
  if (city) filters.city = city;
  if (locality) filters.locality = locality;
  const min = form.priceMin.trim();
  const max = form.priceMax.trim();
  if (min) filters.price_min = Number(min);
  if (max) filters.price_max = Number(max);
  return filters;
}

function formFromFilters(name: string, filters: SearchFilters): AlertFormState {
  return {
    name,
    city: filters.city ?? "",
    locality: filters.locality ?? "",
    priceMin: filters.price_min !== undefined ? String(filters.price_min) : "",
    priceMax: filters.price_max !== undefined ? String(filters.price_max) : "",
    frequency: "daily",
    channels: ["push"],
  };
}

function formFromAlert(alert: {
  name: string;
  filters: SearchFilters;
  frequency: AlertFrequency;
  channels: AlertChannel[];
}): AlertFormState {
  return {
    ...formFromFilters(alert.name, alert.filters),
    frequency: alert.frequency,
    channels: alert.channels.length > 0 ? alert.channels : ["push"],
  };
}

export function AlertsPage() {
  const { data: alerts, isLoading, error, refetch } = useSearchAlerts();
  const createAlert = useCreateSearchAlert();
  const updateAlert = useUpdateSearchAlert();
  const deleteAlert = useDeleteSearchAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<AlertFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Confirmation modal for delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const confirmTarget = alerts?.find((a) => a.id === confirmDeleteId) ?? null;

  // Auto-open the create modal when a saved search hands off its filters
  // (e.g. ?seedCity=Gurugram&seedLocality=DLF+Phase+1&seedPriceMax=20000).
  // The flag is cleared as soon as we've consumed it so a refresh does not
  // re-open the modal. The setState calls here are legitimate: the URL is
  // an external system that drives the modal state, and we only run once
  // per "seedOpen=1" appearance.
  useEffect(() => {
    if (searchParams.get("seedOpen") !== "1") return;
    const seedFilters: SearchFilters = {};
    const city = searchParams.get("seedCity");
    const locality = searchParams.get("seedLocality");
    const priceMin = searchParams.get("seedPriceMin");
    const priceMax = searchParams.get("seedPriceMax");
    if (city) seedFilters.city = city;
    if (locality) seedFilters.locality = locality;
    if (priceMin) seedFilters.price_min = Number(priceMin);
    if (priceMax) seedFilters.price_max = Number(priceMax);
    /* eslint-disable react-hooks/set-state-in-effect -- see comment above. */
    setEditingId(null);
    setCreateForm({ ...formFromFilters("", seedFilters) });
    setShowCreateModal(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const next = new URLSearchParams(searchParams);
    next.delete("seedOpen");
    next.delete("seedCity");
    next.delete("seedLocality");
    next.delete("seedPriceMin");
    next.delete("seedPriceMax");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setCreateForm(EMPTY_FORM);
    setShowCreateModal(true);
  }, []);

  const closeCreate = useCallback(() => {
    setShowCreateModal(false);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((alert: NonNullable<typeof alerts>[number]) => {
    setEditingId(alert.id);
    setCreateForm(formFromAlert(alert));
    setShowCreateModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!createForm.name.trim()) return;
    if (createForm.channels.length === 0) return;

    const payload: SearchAlertCreate = {
      name: createForm.name.trim(),
      filters: buildFilters(createForm),
      frequency: createForm.frequency,
      channels: createForm.channels,
    };

    if (editingId !== null) {
      updateAlert.mutate(
        { id: editingId, payload },
        {
          onSuccess: () => {
            uiStore.getState().pushToast({
              type: "success",
              title: "Alert updated",
            });
            closeCreate();
          },
          onError: () => {
            uiStore.getState().pushToast({
              type: "error",
              title: "Could not update alert",
            });
          },
        }
      );
    } else {
      createAlert.mutate(payload, {
        onSuccess: () => {
          uiStore.getState().pushToast({
            type: "success",
            title: "Alert created",
          });
          closeCreate();
        },
        onError: () => {
          uiStore.getState().pushToast({
            type: "error",
            title: "Could not create alert",
          });
        },
      });
    }
  }, [createForm, createAlert, updateAlert, editingId, closeCreate]);

  const isSaving = createAlert.isPending || updateAlert.isPending;
  const canSave =
    createForm.name.trim().length > 0 && createForm.channels.length > 0;

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1">Search Alerts</h1>
        <Button
          size="compact"
          leadingIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
          onClick={openCreate}
        >
          Create Alert
        </Button>
      </div>

      <AsyncView
        data={alerts ?? []}
        isLoading={isLoading}
        error={error}
        isEmpty={(data) => data.length === 0}
        loading={<Skeleton variant="alertCard" count={3} />}
        errorView={
          <Card className="flex items-center justify-center p-8">
            <ErrorState
              title="Could not load alerts"
              description="Please retry. Your alert settings were not changed."
              actionLabel="Retry"
              onRetry={() => refetch()}
            />
          </Card>
        }
        empty={
          <EmptyState
            title="No alerts yet"
            description="Create an alert to get notified when new listings match your criteria."
            icon={<Bell aria-hidden="true" className="h-6 w-6" />}
            actionLabel="Create alert"
            onAction={openCreate}
          />
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <ul className="flex flex-col gap-3" aria-label="Search alerts">
            {data.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onEdit={handleEdit}
                onTogglePause={(a) => {
                  updateAlert.mutate(
                    { id: a.id, payload: { enabled: !a.enabled } },
                    {
                      onSuccess: () => {
                        uiStore.getState().pushToast({
                          type: "success",
                          title: a.enabled ? "Alert disabled" : "Alert enabled",
                        });
                      },
                      onError: () => {
                        uiStore.getState().pushToast({
                          type: "error",
                          title: "Could not update alert",
                        });
                      },
                    }
                  );
                }}
                togglePending={updateAlert.isPending}
                onRequestDelete={setConfirmDeleteId}
                deletePending={deleteAlert.isPending}
                deleteIsThisRow={confirmDeleteId === alert.id}
              />
            ))}
          </ul>
        )}
      </AsyncView>

      {/* Create / edit alert modal */}
      <AlertFormModal
        open={showCreateModal}
        isEditing={editingId !== null}
        form={createForm}
        onFormChange={setCreateForm}
        isSaving={isSaving}
        canSave={canSave}
        onClose={closeCreate}
        onSave={handleSave}
      />

      {/* Delete confirmation modal */}
      <Modal
        open={confirmDeleteId !== null}
        title="Delete this alert?"
        description={confirmTarget ? `"${confirmTarget.name}" will be removed and you will stop receiving notifications.` : "This alert will be permanently removed."}
        onClose={() => setConfirmDeleteId(null)}
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirmDeleteId(null)}>
              Keep it
            </Button>
            <Button
              className="bg-error text-white shadow-none hover:bg-error/90"
              loading={deleteAlert.isPending}
              onClick={() => {
                if (confirmDeleteId !== null) {
                  deleteAlert.mutate(confirmDeleteId, {
                    onSuccess: () => {
                      uiStore.getState().pushToast({
                        type: "success",
                        title: "Alert deleted",
                      });
                    },
                    onError: () => {
                      uiStore.getState().pushToast({
                        type: "error",
                        title: "Could not delete alert",
                      });
                    },
                    onSettled: () => {
                      setConfirmDeleteId(null);
                    },
                  });
                }
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
