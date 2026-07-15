import { z } from "zod";
import { visitContextSchema, visitStatusSchema } from "./enums";

export const visitCreateSchema = z
  .object({
    property_id: z.number().int().positive(),
    visit_context: visitContextSchema.default("flatmate_meet"),
    scheduled_date: z.string(),
    conversation_id: z.number().int().positive().optional(),
    counterparty_user_id: z.number().int().positive().optional(),
    match_id: z.number().int().positive().optional(),
    special_requirements: z.string().max(500).optional(),
    visit_notes: z.string().max(500).optional()
  })
  .refine(
    (value) =>
      value.visit_context !== "flatmate_meet" ||
      (value.conversation_id !== undefined &&
        value.counterparty_user_id !== undefined),
    {
      message: "Flatmate meets require a conversation and counterparty",
      path: ["conversation_id"]
    }
  );

const _visitSchema = visitCreateSchema.extend({
  id: z.number().int().positive(),
  user_id: z.number().int().positive().optional(),
  property_title: z.string().optional(),
  agent_id: z.number().int().positive().optional(),
  actual_date: z.string().optional(),
  status: visitStatusSchema,
  visitor_feedback: z.string().optional(),
  interest_level: z.string().optional(),
  follow_up_required: z.boolean().optional(),
  follow_up_date: z.string().optional(),
  cancellation_reason: z.string().optional(),
  rescheduled_from: z.string().optional(),
  created_at: z.string().optional()
});

export type VisitCreateInput = z.infer<typeof visitCreateSchema>;
export type VisitInput = z.infer<typeof _visitSchema>;

