import type { Schemas } from "./schema";

export type BugType = Schemas["BugType"];
export type BugSeverity = Schemas["BugSeverity"];
export type BugStatus = Schemas["BugStatus"];

export type BugReportCreate = Schemas["BugReportCreate"];
export type BugReportOut = Schemas["BugReportResponse"];

/** Onboarding gate stage from GET /users/me/auth-state (see lib/api/auth.ts). */
export type AuthStage = Schemas["AuthGateState"]["stage"];
export type AuthGateState = Schemas["AuthGateState"];
