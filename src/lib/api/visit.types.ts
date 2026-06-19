import type { InterestLevel, VisitContext, VisitStatus } from "@/lib/data";

export interface VisitCreate {
  property_id: number;
  visit_context?: VisitContext;
  scheduled_date: string;
  conversation_id?: number;
  counterparty_user_id?: number;
  match_id?: number;
  special_requirements?: string;
  visit_notes?: string;
}

export interface VisitUpdate {
  status?: VisitStatus;
  scheduled_date?: string;
  special_requirements?: string;
  visit_notes?: string;
  visitor_feedback?: string;
  interest_level?: InterestLevel;
  follow_up_required?: boolean;
  follow_up_date?: string;
}

export interface VisitReschedule {
  new_date: string;
  reason?: string;
}

export interface VisitCancel {
  reason?: string;
}

export interface VisitComplete {
  notes?: string;
  feedback?: string;
}

export interface Visit {
  id: number;
  user_id?: number;
  property_id: number;
  property_title?: string;
  agent_id?: number;
  counterparty_user_id?: number;
  conversation_id?: number;
  match_id?: number;
  visit_context: VisitContext;
  scheduled_date: string;
  actual_date?: string;
  status: VisitStatus;
  special_requirements?: string;
  visit_notes?: string;
  visitor_feedback?: string;
  interest_level?: InterestLevel;
  follow_up_required?: boolean;
  follow_up_date?: string;
  cancellation_reason?: string;
  rescheduled_from?: string;
  created_at?: string;
}

/** @deprecated Use {@link VisitCursorPage} instead. */
export interface VisitList {
  visits: Visit[];
  total: number;
}

export type VisitCursorPage = import("./common.types").CursorPage<Visit>;

export interface VisitFilters {
  status?: VisitStatus;
  context?: VisitContext;
  upcoming?: boolean;
  past?: boolean;
  limit?: number;
  cursor?: string;
}
