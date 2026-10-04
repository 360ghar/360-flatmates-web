import { Bell, BellOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { humanizeSnakeCase, toTitleCase } from "@/lib/utils/format";
import type { SearchAlert } from "@/lib/api/types";

export function AlertRow({
  alert,
  onEdit,
  onTogglePause,
  togglePending,
  onRequestDelete,
  deletePending,
  deleteIsThisRow
}: {
  alert: SearchAlert;
  onEdit: (alert: SearchAlert) => void;
  onTogglePause: (alert: SearchAlert) => void;
  togglePending: boolean;
  onRequestDelete: (id: number) => void;
  deletePending: boolean;
  deleteIsThisRow: boolean;
}) {
  return (
    <Card as="li" className="flex items-center justify-between gap-4 p-4">
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
          aria-label={`Edit alert: ${alert.name}`}
          onClick={() => onEdit(alert)}
        >
          <Pencil aria-hidden="true" className="h-4 w-4" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          aria-label={alert.enabled ? `Pause alert: ${alert.name}` : `Resume alert: ${alert.name}`}
          onClick={() => onTogglePause(alert)}
          loading={togglePending}
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
          onClick={() => onRequestDelete(alert.id)}
          loading={deletePending && deleteIsThisRow}
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
