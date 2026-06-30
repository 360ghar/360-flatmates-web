export type BugType =
  | "ui_bug"
  | "functionality_bug"
  | "performance_issue"
  | "crash"
  | "feature_request"
  | "other";

export type BugSeverity = "low" | "medium" | "high" | "critical";
export type BugStatus = "open" | "in_progress" | "resolved" | "closed";

export interface BugReportCreate {
  source: "web" | "mobile" | "api";
  bug_type: BugType;
  severity: BugSeverity;
  title: string;
  description: string;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  device_info?: Record<string, unknown>;
  app_version?: string;
  media_urls?: string[];
  tags?: string[];
}

export interface BugReportOut {
  id: number;
  user_id?: number | null;
  source: string;
  bug_type: BugType;
  severity: BugSeverity;
  status: BugStatus;
  title: string;
  description: string;
  steps_to_reproduce?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  device_info?: Record<string, unknown> | null;
  app_version?: string | null;
  media_urls?: string[] | null;
  tags?: string[] | null;
  assigned_to?: number | null;
  resolution?: string | null;
  resolved_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}
