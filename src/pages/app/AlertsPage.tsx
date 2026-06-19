import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Bell, BellOff, Plus, Trash2 } from "lucide-react";
import {
  useSearchAlerts,
  useCreateSearchAlert,
  useUpdateSearchAlert,
  useDeleteSearchAlert
} from "@/hooks/queries";
import { uiStore } from "@/lib/stores/ui-store";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { Input, SelectField } from "@/components/ui/Input";
import { AsyncView, EmptyState } from "@/components/ui/StateViews";
import { Skeleton } from "@/components/ui/Skeleton";
import { humanizeSnakeCase, toTitleCase } from "@/lib/utils/format";
import {
  ALERT_FREQUENCY_VALUES,
  ALERT_CHANNEL_VALUES,
  type AlertChannel,
  type AlertFrequency,
} from "@/lib/data";
import type { SearchAlertCreate, SearchFilters } from "@/lib/api/types";

const FREQUENCY_OPTIONS = ALERT_FREQUENCY_VALUES.map((v) => ({
  value: v,
  label: toTitleCase(humanizeSnakeCase(v)),
}));
const CHANNEL_OPTIONS = ALERT_CHANNEL_VALUES.map((v) => ({
  value: v,
  label: toTitleCase(humanizeSnakeCase(v)),
}));

function toggleChannel(channels: AlertChannel[], channel: AlertChannel): AlertChannel[] {
  return channels.includes(channel)
    ? channels.filter((c) => c !== channel)
    : [...channels, channel];
}

interface CreateAlertFormState {
  name: string;
  city: string;
  locality: string;
  priceMin: string;
  priceMax: string;
  frequency: AlertFrequency;
  channels: AlertChannel[];
}

const EMPTY_FORM: CreateAlertFormState = {
  name: "",
  city: "",
  locality: "",
  priceMin: "",
  priceMax: "",
  frequency: "daily",
  channels: ["push"],
};

function buildFilters(form: CreateAlertFormState): SearchFilters {
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

function formFromFilters(name: string, filters: SearchFilters): CreateAlertFormState {
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

export function AlertsPage() {
  const { data: alerts, isLoading, error, refetch } = useSearchAlerts();
  const createAlert = useCreateSearchAlert();
  const updateAlert = useUpdateSearchAlert();
  const deleteAlert = useDeleteSearchAlert();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateAlertFormState>(EMPTY_FORM);
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

  // TODO(edit-alert): wire an "Edit" action on each row that pre-populates
  // the modal via handleEdit. The hook for updating already exists
  // (useUpdateSearchAlert) but the UI affordance is not yet attached.

  const isSaving = createAlert.isPending || updateAlert.isPending;
  const canSave =
    createForm.name.trim().length > 0 && createForm.channels.length > 0;

  const frequencyLabel = useMemo(
    () => toTitleCase(humanizeSnakeCase(createForm.frequency)),
    [createForm.frequency]
  );

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
        loading={
          <div className="flex flex-col gap-3" aria-hidden="true">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="min-w-0 flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
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
              title="No alerts yet"
              description="Create an alert to get notified when new listings match your criteria."
              icon={<Bell aria-hidden="true" className="h-6 w-6" />}
              actionLabel="Create alert"
              onAction={openCreate}
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
          <div className="flex flex-col gap-3" role="list" aria-label="Search alerts">
            {data.map((alert) => (
              <Card key={alert.id} className="flex items-center justify-between gap-4 p-4" role="listitem">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-body-md font-semibold text-ink truncate">{alert.name}</h2>
                    {alert.enabled ? (
                      <Chip variant="info" selected>Active</Chip>
                    ) : (
                      <Chip variant="info">Paused</Chip>
                    )}
                  </div>
                  <p className="text-caption text-ink-3 mt-1">
                    {toTitleCase(humanizeSnakeCase(alert.frequency))} ·{" "}
                    {alert.channels
                      .map((c) => toTitleCase(humanizeSnakeCase(c)))
                      .join(", ")}
                  </p>
                  {alert.results_sent_count !== undefined && alert.results_sent_count > 0 && (
                    <p className="text-caption text-ink-3">
                      {alert.results_sent_count} results sent
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="icon"
                    size="icon"
                    aria-label={alert.enabled ? `Pause alert: ${alert.name}` : `Resume alert: ${alert.name}`}
                    onClick={() => {
                      updateAlert.mutate(
                        { id: alert.id, payload: { enabled: !alert.enabled } },
                        {
                          onSuccess: () => {
                            uiStore.getState().pushToast({
                              type: "success",
                              title: alert.enabled ? "Alert disabled" : "Alert enabled",
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
                    loading={updateAlert.isPending}
                  >
                    {alert.enabled ? (
                      <BellOff aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <Bell aria-hidden="true" className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="icon"
                    size="icon"
                    aria-label={`Delete alert: ${alert.name}`}
                    onClick={() => setConfirmDeleteId(alert.id)}
                    loading={deleteAlert.isPending && confirmDeleteId === alert.id}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </AsyncView>

      {/* Create / edit alert modal */}
      <Modal
        open={showCreateModal}
        title={editingId !== null ? "Edit Search Alert" : "Create Search Alert"}
        description="Get notified when new listings match your search criteria."
        onClose={closeCreate}
        footer={
          <>
            <Button variant="tertiary" onClick={closeCreate}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              loading={isSaving}
              disabled={!canSave}
            >
              {editingId !== null ? "Save changes" : "Create alert"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Alert name"
            placeholder="e.g. 1BHK in Koramangala under 15k"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm((prev) => ({ ...prev, name: e.target.value }))
            }
          />

          <div className="flex flex-col gap-2">
            <p className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3">
              Filters
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="City"
                placeholder="Gurugram"
                value={createForm.city}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, city: e.target.value }))
                }
              />
              <Input
                label="Locality"
                placeholder="DLF Phase 1"
                value={createForm.locality}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, locality: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Min price (₹)"
                type="number"
                placeholder="10000"
                value={createForm.priceMin}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, priceMin: e.target.value }))
                }
              />
              <Input
                label="Max price (₹)"
                type="number"
                placeholder="20000"
                value={createForm.priceMax}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, priceMax: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3">
              Frequency
            </p>
            <SelectField
              options={FREQUENCY_OPTIONS}
              value={createForm.frequency}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  frequency: e.target.value as AlertFrequency,
                }))
              }
              helperText={`Currently ${frequencyLabel}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3">
              Channels
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Alert channels">
              {CHANNEL_OPTIONS.map((opt) => {
                const selected = createForm.channels.includes(opt.value as AlertChannel);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() =>
                      setCreateForm((prev) => ({
                        ...prev,
                        channels: toggleChannel(prev.channels, opt.value as AlertChannel),
                      }))
                    }
                    className={
                      "rounded-full border px-3 py-1.5 text-caption font-semibold transition-colors " +
                      (selected
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line bg-surface text-ink-2 hover:border-accent/40")
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {createForm.channels.length === 0 && (
              <p className="text-caption text-error">Select at least one channel.</p>
            )}
          </div>
        </div>
      </Modal>

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
