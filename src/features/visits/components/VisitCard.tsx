import type { HTMLAttributes } from "react";
import { Badge, type StatusTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, focusRing } from "@/components/ui/component-utils";

// The card takes the component-level status. `visitToVisitCardProps` folds
// `requested` and `reschedule_suggested` into "pending"; use
// `visitStatusToCardStatus` to keep the difference.
export type VisitStatus =
  | "pending"
  | "confirmed"
  | "reschedule_suggested"
  | "cancelled"
  | "completed";

export type VisitType = "Property tour" | "Flatmate meet";

export interface VisitCardData {
  id: string;
  propertyTitle: string;
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

function dateParts(value: string) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return null;
  const f = (options: Intl.DateTimeFormatOptions) => parsed.toLocaleString("en-IN", options);
  return {
    month: f({ month: "short" }),
    day: f({ day: "numeric" }),
    weekday: f({ weekday: "short" }),
    time: f({ hour: "numeric", minute: "2-digit" })
  };
}

export interface VisitCardProps extends HTMLAttributes<HTMLElement> {
  visit: VisitCardData;
  /** Show Confirm on a pending visit. */
  canConfirm?: boolean;
  /** Disables the actions while a change is saving. */
  busy?: boolean;
  /** Makes the whole pass open the visit. */
  onOpen?: (visitId: string) => void;
  onConfirm?: (visitId: string) => void;
  onReschedule?: (visitId: string) => void;
  onCancel?: (visitId: string) => void;
  onRate?: (visitId: string) => void;
}

/**
 * A visit as a paper pass: the date on a tear-off stub, the place and status
 * beside it. Actions appear only for the handlers given, so no button is dead.
 */
export function VisitCard({
  visit,
  canConfirm = false,
  busy = false,
  onOpen,
  onConfirm,
  onReschedule,
  onCancel,
  onRate,
  className,
  ...props
}: VisitCardProps) {
  const parts = dateParts(visit.dateTime);
  const open = visit.status === "pending" || visit.status === "confirmed" || visit.status === "reschedule_suggested";
  const actions = [
    visit.status === "pending" && canConfirm && onConfirm ? (
      <Button key="confirm" size="compact" disabled={busy} onClick={() => onConfirm(visit.id)}>
        Confirm
      </Button>
    ) : null,
    open && onReschedule ? (
      <Button key="reschedule" size="compact" variant="tertiary" disabled={busy} onClick={() => onReschedule(visit.id)}>
        Reschedule
      </Button>
    ) : null,
    open && onCancel ? (
      <Button key="cancel" size="compact" variant="tertiary" disabled={busy} onClick={() => onCancel(visit.id)}>
        Cancel
      </Button>
    ) : null,
    visit.status === "completed" && onRate ? (
      <Button key="rate" size="compact" variant="tertiary" disabled={busy} onClick={() => onRate(visit.id)}>
        Rate
      </Button>
    ) : null
  ].filter(Boolean);

  return (
    <article className={cn("relative [filter:drop-shadow(0_1px_1.5px_rgb(35_32_28/0.12))]", className)} {...props}>
      <div className="paper-edge-ticket paper-grain flex min-w-0 rounded-cut-lg bg-surface [--stub:88px]">
        <div className="flex w-[88px] shrink-0 flex-col items-center justify-center rounded-l-cut-lg bg-paper-1 px-2 py-4 text-center">
          {parts ? (
            <time dateTime={visit.dateTime}>
              <span className="block text-caption text-ink-3">{parts.month}</span>
              <span className="tabular block text-h1 text-ink">{parts.day}</span>
              <span className="block text-caption text-ink-3">{parts.weekday}</span>
            </time>
          ) : (
            <span className="text-caption text-ink-3">Date to be confirmed</span>
          )}
        </div>
        <div className="min-w-0 flex-1 p-4 pl-5">
          <p className="text-caption text-ink-3">
            {visit.type}
            {parts ? ` · ${parts.time}` : ""}
          </p>
          <h3 className="mt-0.5 truncate text-body-lg font-semibold text-ink">
            {onOpen ? (
              <button
                type="button"
                onClick={() => onOpen(visit.id)}
                className={cn("text-left after:absolute after:inset-0 after:rounded-cut-lg hover:text-clay", focusRing)}
              >
                {visit.propertyTitle}
              </button>
            ) : (
              visit.propertyTitle
            )}
          </h3>
          <Badge className="mt-1.5" status={STATUS_TONE[visit.status]} variant="status">
            {STATUS_LABEL[visit.status]}
          </Badge>
          {actions.length ? <div className="relative mt-2 flex flex-wrap gap-1">{actions}</div> : null}
        </div>
      </div>
    </article>
  );
}
