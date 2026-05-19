import type {
  ConversationSource,
  ConversationStatus,
  MessageType
} from "@/lib/data";
import type { FlatmatesPeer } from "./user.types";
import type { JsonObject } from "./common.types";

export interface ConversationPropertyContext {
  id: number;
  title: string;
  locality?: string;
  city?: string;
  monthly_rent?: number;
  main_image_url?: string;
  owner_name?: string;
  owner_image_url?: string;
}

export interface ConversationQnAAnswer {
  user_id: number;
  q1?: string;
  q2?: string;
  q3?: string;
}

export interface ConversationQnAState {
  current_user?: ConversationQnAAnswer;
  peer?: ConversationQnAAnswer;
  both_answered?: boolean;
}

export interface ConversationSummary {
  id: number;
  source: ConversationSource;
  status: ConversationStatus;
  peer: FlatmatesPeer;
  context_property?: ConversationPropertyContext;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count?: number;
  matched_at?: string;
  qna?: ConversationQnAState;
}

export interface MessageCreate {
  body?: string;
  attachment_url?: string;
  message_type?: MessageType;
  metadata?: JsonObject;
}

export interface MessageOut {
  id: number;
  conversation_id: number;
  sender_id: number;
  body?: string;
  attachment_url?: string;
  message_type: MessageType;
  metadata?: JsonObject;
  read_at?: string;
  created_at?: string;
}

export interface QnAAnswers {
  answers: Record<string, string>;
}

export interface ConversationCreate {
  match_id?: number;
  peer_user_id: number;
  context_property_id?: number;
  initial_message?: string;
}

export interface MessageListResponse {
  messages: MessageOut[];
  total: number;
  has_more: boolean;
}
