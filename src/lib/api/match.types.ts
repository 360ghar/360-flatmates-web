import type { CompatibilityColor, LifestyleDimensionKey, UserMatchStatus } from "@/lib/data";
import type { FlatmatesPeer } from "./user.types";
import type { ConversationPropertyContext } from "./conversation.types";
import type { CursorPage } from "./common.types";

export interface IncomingLikeSummary {
  id: number;
  peer: FlatmatesPeer;
  context_property?: ConversationPropertyContext;
  created_at?: string;
}

export interface MatchSummary {
  id: number;
  status: UserMatchStatus;
  peer: FlatmatesPeer;
  context_property?: ConversationPropertyContext;
  created_at?: string;
}

/** @deprecated Use {@link MatchCursorPage} instead. */
export interface MatchesResponse {
  matches: MatchSummary[];
  total: number;
}

export type MatchCursorPage = CursorPage<MatchSummary>;
export type IncomingLikeCursorPage = CursorPage<IncomingLikeSummary>;

export interface CompatibilityDimension {
  name: LifestyleDimensionKey;
  weight: number;
  user_value: string | null;
  peer_value: string | null;
  score: number;
  match: boolean;
  summary: string;
}

export interface CompatibilityBreakdown {
  user_id: number;
  peer_id: number;
  overall_percentage: number;
  color: CompatibilityColor;
  dimensions: CompatibilityDimension[];
  summary: string[];
}
