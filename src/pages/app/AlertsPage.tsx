import { useState } from "react";
import { Bell, Plus } from "lucide-react";
import { useSearchAlerts, useCreateSearchAlert } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { AsyncView } from "@/components/ui/StateViews";
import type { SearchAlertCreate } from "@/lib/api/types";

export function AlertsPage() {
  const { data: alerts, isLoading, error, refetch } = useSearchAlerts();
  const createAlert = useCreateSearchAlert();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlertName, setNewAlertName] = useState("");

  function handleCreate() {
    if (!newAlertName.trim()) return;

    const payload: SearchAlertCreate = {
      name: newAlertName.trim(),
      filters: {},
      frequency: "daily",
      channels: ["push"]
    };

    createAlert.mutate(payload, {
      onSuccess: () => {
        setShowCreateModal(false);
        setNewAlertName("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 page-fade">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-h1">Search Alerts</h1>
        <Button
          size="compact"
          leadingIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
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
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm">
                <div className="min-w-0 flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-28 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
                    <div className="h-5 w-14 rounded-full shimmer animate-shimmer motion-reduce:animate-none" />
                  </div>
                  <div className="h-3 w-24 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
                  <div className="h-3 w-20 rounded-sm shimmer animate-shimmer motion-reduce:animate-none" />
                </div>
                <div className="h-9 w-9 rounded-[9px] shimmer animate-shimmer motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        }
        empty={
          <p className="py-8 text-center text-body-md text-ink-3">
            No alerts yet. Create an alert to get notified when new listings match your criteria.
          </p>
        }
        onRetry={() => refetch()}
      >
        {(data) => (
          <div className="flex flex-col gap-3">
            {data.map((alert) => (
              <Card key={alert.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-body-md font-semibold text-ink truncate">{alert.name}</h2>
                    {alert.enabled && (
                      <Chip variant="info" selected={alert.enabled}>
                        Active
                      </Chip>
                    )}
                  </div>
                  <p className="text-caption text-ink-3 mt-1">
                    {alert.frequency} &middot; {alert.channels.join(", ")}
                  </p>
                  {alert.results_sent_count !== undefined && (
                    <p className="text-caption text-ink-3">
                      {alert.results_sent_count} results sent
                    </p>
                  )}
                </div>
                <Button
                  variant="icon"
                  size="icon"
                  aria-label={alert.enabled ? "Disable alert" : "Enable alert"}
                  onClick={() => {
                  }}
                >
                  <Bell aria-hidden="true" className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </AsyncView>

      {/* Create alert modal */}
      <Modal
        open={showCreateModal}
        title="Create Search Alert"
        description="Get notified when new listings match your search criteria."
        onClose={() => setShowCreateModal(false)}
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              loading={createAlert.isPending}
              disabled={!newAlertName.trim()}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Alert Name"
            placeholder="e.g. 1BHK in Koramangala under 15k"
            value={newAlertName}
            onChange={(e) => setNewAlertName(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
