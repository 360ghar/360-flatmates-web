import type { Visit as ApiVisit } from "@/lib/api/types";
import type { VisitContext, VisitStatus as ApiVisitStatus } from "@/lib/data";
import type { VisitCardData, VisitType, VisitStatus as ComponentVisitStatus } from "@/features/visits/components/VisitCard";

/** Map API visit context to component visit type */
function mapVisitContext(context: VisitContext): VisitType {
  return context === "property_tour" ? "Property tour" : "Flatmate meet";
}

/** Map API visit status to component visit status */
function mapVisitStatus(status: ApiVisitStatus): ComponentVisitStatus {
  const statusMap: Record<ApiVisitStatus, ComponentVisitStatus> = {
    requested: "pending",
    confirmed: "confirmed",
    reschedule_suggested: "pending",
    cancelled: "cancelled",
    completed: "completed"
  };
  return statusMap[status] ?? "pending";
}

/** Map API visit to VisitCardData for the VisitCard component */
export function visitToVisitCardProps(visit: ApiVisit): VisitCardData {
  return {
    id: String(visit.id),
    propertyTitle: visit.property_title ?? `Property #${visit.property_id}`,
    type: mapVisitContext(visit.visit_context),
    dateTime: visit.scheduled_date,
    status: mapVisitStatus(visit.status)
  };
}

/**
 * Map an API visit status string to the card-level status. Differs from the
 * `visitToVisitCardProps` adapter only in that `reschedule_suggested` is
 * preserved (the adapter collapses it to "pending"). Pages that need the
 * distinction should use this helper when building card data inline.
 */
export function visitStatusToCardStatus(
  status: "requested" | "confirmed" | "reschedule_suggested" | "cancelled" | "completed"
): ComponentVisitStatus {
  if (status === "requested") return "pending";
  return status;
}
