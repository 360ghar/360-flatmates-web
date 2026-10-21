import type { ListingModerationStatus, ReportStatus } from "@/lib/data";
import type { Schemas, WriteBody } from "./schema";

/** One row of the listing moderation queue (`GET /flatmates/moderation/listings`). */
export type FlatmateListingAdmin = Schemas["FlatmateListingAdmin"];
export type AdminListingCursorPage = Schemas["CursorPage_FlatmateListingAdmin_"];

/** Body of `PUT /flatmates/moderation/listings/{id}`. */
export type ListingModerationPayload = WriteBody<Schemas["ListingModerationAction"], "reason">;
export type ListingModerationResult = Schemas["ListingModerationResult"];
export type ListingPrescreenResult = Schemas["ListingPrescreenResult"];

/** One row of the report queue (`GET /flatmates/moderation/reports`). */
export type ReportAdmin = Schemas["FlatmateReportAdmin"];
export type AdminReportCursorPage = Schemas["CursorPage_FlatmateReportAdmin_"];
export type FlatmateAdminUser = Schemas["FlatmateAdminUser"];

/** Body of `PUT /flatmates/moderation/reports/{id}`. */
export type ReportActionPayload = WriteBody<Schemas["ReportModerationAction"], "notes">;
export type ReportModerationResult = Schemas["ReportModerationResult"];

/** Declared query keys of `GET /flatmates/moderation/listings`. `status` defaults to `pending_review`. */
export interface AdminListingFilters {
  status?: ListingModerationStatus;
  limit?: number;
  cursor?: string;
}

/** Declared query keys of `GET /flatmates/moderation/reports`. `status` defaults to `open`. */
export interface AdminReportFilters {
  status?: ReportStatus;
  limit?: number;
  cursor?: string;
}
