import type { Schemas, WriteBody } from "./schema";

/** `GET /flatmates/profile` and write responses. Nullable fields stay null. */
export type FlatmatesProfile = Schemas["FlatmatesProfile"];

/** Body of `PUT`, `PATCH` and `POST /flatmates/profile`. No `email` or `phone`. */
export type FlatmatesProfileUpdate = Schemas["FlatmatesProfileUpdate"];

/**
 * A peer in a swipe deck, match, like or conversation. It never carries a
 * phone number: use {@link MatchContact} for a matched peer. Listing context is
 * the nested `listing` object (null when the peer has no live listing).
 */
export type FlatmatesPeer = Schemas["FlatmatesPeer"];
export type PeerListingSummary = Schemas["PeerListingSummary"];
export type PeerCursorPage = Schemas["CursorPage_FlatmatesPeer_"];

export type FlatmatesRealtimeConfig = Schemas["FlatmatesRealtimeConfig"];
export type FlatmatesRealtimeEventType =
  | "new_match"
  | "new_message"
  | "conversation_updated"
  | "visit_updated"
  | "listing_status_changed"
  | "new_notification";

export type FlatmatesBootstrap = Schemas["FlatmatesBootstrap"];

export type ProfileViewEventCreate = WriteBody<Schemas["ProfileViewEventCreate"], "source">;
export type ProfileViewEventOut = Schemas["ProfileViewEventOut"];

/** Body of `POST /flatmates/reports`. `reported_user_id` is required. */
export type ReportCreate = Schemas["ReportCreate"];
export type ReportOut = Schemas["ReportOut"];

/** Declared query keys of `GET /flatmates/profiles`. `move_in` is a free string. */
export interface PeerFilters {
  city?: string;
  budget_min?: number;
  budget_max?: number;
  move_in?: string;
  age_min?: number;
  age_max?: number;
  limit?: number;
  cursor?: string;
}

export type SocietyTagVoteCreate = Schemas["SocietyTagVoteCreate"];
export type SocietyTagVoteOut = Schemas["SocietyTagVoteOut"];

/** A row of `GET /flatmates/blocks`: the blocked user is a `PublicUserRef`. */
export type BlockedUser = Schemas["BlockedUserOut"];
/** Reply of `POST /flatmates/blocks` (201). */
export type BlockOut = Schemas["BlockOut"];
export type BlockedUserCursorPage = Schemas["CursorPage_BlockedUserOut_"];

/** The signed-in user (`GET /users/me`, the avatar upload reply). Holds the only copy of `supabase_user_id`. */
export type SelfUser = Schemas["SelfUser"];
