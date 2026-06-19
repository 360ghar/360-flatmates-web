import type {
  ModerationAction,
  PropertyModerationStatus,
  ReportAction,
  ReportStatus
} from "@/lib/data";
import type { JsonObject } from "./common.types";
import type { CursorPage } from "./common.types";

// Re-export domain enums so consumers can import from "@/lib/api/types"
export type { PropertyModerationStatus, ReportStatus };

export interface ListingModerationPayload {
  action: ModerationAction;
  reason?: string;
}

export interface FlatmateListingAdmin {
  id: number;
  title: string;
  owner_id: number;
  owner_name: string;
  owner_phone?: string;
  city: string;
  locality: string;
  monthly_rent: number;
  main_image_url?: string;
  image_urls?: string[];
  description?: string;
  moderation_status: PropertyModerationStatus;
  created_at?: string;
  ai_prescreen_result?: JsonObject;
  ai_prescreen_flags?: string[];
  ai_prescreen_reason?: string;
}

/** @deprecated Use {@link AdminListingCursorPage} instead. */
export interface AdminListingsResponse {
  listings: FlatmateListingAdmin[];
  total: number;
  limit: number;
  offset: number;
}

export type AdminListingCursorPage = CursorPage<FlatmateListingAdmin>;

export interface ReportAdmin {
  id: number;
  reporter_user_id: number;
  reporter_name: string;
  reported_user_id: number;
  reported_name: string;
  conversation_id?: number | null;
  property_id?: number | null;
  reason: string;
  status: ReportStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/** @deprecated Use {@link AdminReportCursorPage} instead. */
export interface AdminReportsResponse {
  reports: ReportAdmin[];
  total: number;
  limit: number;
  offset: number;
}

export type AdminReportCursorPage = CursorPage<ReportAdmin>;

export interface ReportActionPayload {
  action: ReportAction;
  notes?: string;
}

export interface AdminStats {
  total_users: number;
  total_listings: number;
  pending_moderation: number;
  total_matches: number;
  total_visits: number;
  active_conversations: number;
}

export interface DashboardStats {
  total_listings: number;
  active_listings: number;
  pending_review: number;
  total_views_30d: number;
  total_likes_30d: number;
  total_conversations_30d: number;
  total_visits_30d: number;
}

export interface AdminListingFilters {
  status?: PropertyModerationStatus;
  limit?: number;
  cursor?: string;
}

export interface AdminReportFilters {
  status?: ReportStatus;
  limit?: number;
  cursor?: string;
}
