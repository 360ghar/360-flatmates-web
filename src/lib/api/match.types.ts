import type { CompatibilityColor, UserMatchStatus } from "@/lib/data";
import type { FlatmatesPeer } from "./user.types";
import type { ConversationPropertyContext } from "./conversation.types";
import type { LifestyleDimensionKey } from "./common.types";

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

export interface MatchesResponse {
  matches: MatchSummary[];
  total: number;
}

export interface CompatibilityDimension {
  name: LifestyleDimensionKey;
  weight: number;
  user_value?: string;
  peer_value?: string;
  score: number;
  match: boolean;
}

export interface CompatibilityBreakdown {
  user_id: number;
  peer_id: number;
  overall_percentage: number;
  color: CompatibilityColor;
  dimensions: CompatibilityDimension[];
  summary: string[];
}
