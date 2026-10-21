import type { Schemas } from "./schema";

export type IncomingLikeSummary = Schemas["IncomingLikeSummary"];
export type OutgoingLikeSummary = Schemas["OutgoingLikeSummary"];
export type MatchSummary = Schemas["MatchSummary"];
export type MatchCursorPage = Schemas["CursorPage_MatchSummary_"];
export type IncomingLikeCursorPage = Schemas["CursorPage_IncomingLikeSummary_"];
export type OutgoingLikeCursorPage = Schemas["CursorPage_OutgoingLikeSummary_"];

/** `GET /flatmates/matches/{id}/contact`: the only place a peer phone appears. */
export type MatchContact = Schemas["MatchContactOut"];
export type MatchStatusOut = Schemas["MatchStatusOut"];

export type CompatibilityBreakdown = Schemas["CompatibilityBreakdown"];
export type CompatibilityDimension = Schemas["CompatibilityDimension"];

/** Body and result of `POST /flatmates/swipes`. */
export type SwipeRequest = Schemas["SwipeRequest"];
export type SwipeResult = Schemas["SwipeResult"];
