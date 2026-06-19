import type { HTMLAttributes } from "react";
import { CalendarDays } from "lucide-react";
import { Badge, type StatusTone } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { NetworkImage } from "../ui/NetworkImage";
import { cn } from "../ui/component-utils";
import { formatDateTime } from "@/lib/utils/format";

// The card accepts the component-level status. The `visitToVisitCardProps`
// adapter collapses both `requested` and `reschedule_suggested` into
// "pending" — pages that need to surface the distinction should construct
// `VisitCardData` inline instead of going through the adapter for the
// status field.
export type VisitStatus =
  | "pending"
  | "confirmed"
  | "reschedule_suggested"
  | "cancelled"
  | "completed";

export type VisitType = "Property Tour" | "Flatmate Meet";

export interface VisitCardData {
  id: string;
  propertyTitle: string;
  propertyImageUrl?: string | null;
  type: VisitType;
  /** ISO date-time string from the API. */
  dateTime: string;
  status: VisitStatus;
}

const STATUS_LABEL: Record<VisitStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  reschedule_suggested: "Reschedule suggested",
  cancelled: "Cancelled",
  completed: "Completed"
};

const STATUS_TONE: Record<VisitStatus, StatusTone> = {
  pending: "pending",
  confirmed: "confirmed",
  reschedule_suggested: "pending",
  cancelled: "cancelled",
  completed: "completed"
};

/**
 * Map an API visit status string to the card-level status. Differs from the
 * `visitToVisitCardProps` adapter only in that `reschedule_suggested` is
 * preserved (the adapter collapses it to "pending"). Pages that need the
 * distinction should use this helper when building card data inline.
 */
export function visitStatusToCardStatus(
  status: "requested" | "confirmed" | "reschedule_suggested" | "cancelled" | "completed"
): VisitStatus {
  if (status === "requested") return "pending";
  return status;
}

/** Format an ISO date-time into a friendly label, falling back to the raw value. */
function formatVisitDateTime(value: string): string {
  if (!value) return "Date to be confirmed";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return formatDateTime(parsed);
}

export interface VisitCardProps extends HTMLAttributes<HTMLElement> {
  visit: VisitCardData;
  /**
   * When true, the inline "Confirm" button is shown for `pending` (i.e.
   * `requested`) visits. Typically only the detail page sets this false
   * because it has its own full-width action row.
   */
  canConfirm?: boolean;
  /** Disables inline action buttons and shows a busy state (e.g. mutation in flight). */
  busy?: boolean;
  onConfirm?: (visitId: string) => void;
  onReschedule?: (visitId: string) => void;
  onCancel?: (visitId: string) => void;
  onRate?: (visitId: string) => void;
}

export function VisitCard({
  visit,
  canConfirm = false,
  busy = false,
  onConfirm,
  onReschedule,
  onCancel,
  onRate,
  className,
  ...props
}: VisitCardProps) {
  const dateLabel = formatVisitDateTime(visit.dateTime);
  const canRescheduleOrCancel =
    visit.status === "pending" ||
    visit.status === "confirmed" ||
    visit.status === "reschedule_suggested";

  return (
    <Card as="article" className={cn("flex gap-3", className)} {...props}>
      {/*
        TODO: `propertyImageUrl` is currently always undefined because the
        adapter doesn't have access to the property. When the visit image is
        actually needed, wire this to `useProperty(visit.property_id)` (via
        the page that owns this card) and pass `main_image_url` through.
      */}
      <NetworkImage
        alt={visit.propertyTitle}
        src={visit.propertyImageUrl}
        wrapperClassName="h-14 w-14 shrink-0 rounded-xl"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-body-md font-semibold text-ink">{visit.propertyTitle}</h3>
          <Badge tone={visit.type === "Property Tour" ? "teal" : "purple"}>{visit.type}</Badge>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-2">
          <CalendarDays aria-hidden="true" className="h-4 w-4 text-accent" />
          <time dateTime={visit.dateTime || undefined}>{dateLabel}</time>
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge status={STATUS_TONE[visit.status]} variant="status">
            {STATUS_LABEL[visit.status]}
          </Badge>
          {visit.status === "pending" && canConfirm ? (
            <Button size="compact" disabled={busy} onClick={() => onConfirm?.(visit.id)}>
              Confirm
            </Button>
          ) : null}
          {canRescheduleOrCancel ? (
            <>
              <Button size="compact" variant="tertiary" disabled={busy} onClick={() => onReschedule?.(visit.id)}>
                Reschedule
              </Button>
              <Button size="compact" variant="tertiary" disabled={busy} onClick={() => onCancel?.(visit.id)}>
                Cancel
              </Button>
            </>
          ) : null}
          {visit.status === "completed" ? (
            <Button size="compact" variant="tertiary" disabled={busy} onClick={() => onRate?.(visit.id)}>
              Rate
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
