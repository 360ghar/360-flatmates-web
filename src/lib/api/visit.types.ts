import type { VisitStatus } from "@/lib/data";
import type { Schemas, WriteBody } from "./schema";

export type Visit = Schemas["Visit"];
export type VisitCursorPage = Schemas["CursorPage_Visit_"];
/** Counterparty and visitor on a visit: name and avatar only. */
export type PublicUserRef = Schemas["PublicUserRef"];

/** Body of `POST /visits`. `scheduled_date` is an ISO time with a UTC offset. */
export type VisitCreate = WriteBody<Schemas["VisitCreate"], "visit_context">;

/** Body of `PUT /visits/{id}`: confirm, notes and feedback only. */
export type VisitUpdate = Schemas["VisitUpdate"];

/** Body of `POST /visits/{id}/reschedule`. `new_date` carries a UTC offset. */
export type VisitReschedule = Schemas["VisitReschedule"];

/** Body of `POST /visits/{id}/cancel`. The reason is required. */
export type VisitCancel = Schemas["VisitCancel"];

/** Body of `PUT /flatmates/visits/{id}` (flatmate meets). */
export type FlatmateVisitUpdate = Schemas["FlatmateVisitUpdate"];

/** `GET /visits` declares `status`, `cursor`, `limit` and `include_total` only. */
export interface VisitFilters {
  status?: VisitStatus;
  limit?: number;
  cursor?: string;
}
