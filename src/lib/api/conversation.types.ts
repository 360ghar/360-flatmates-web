import type { Schemas, WriteBody } from "./schema";

export type ConversationSummary = Schemas["ConversationSummary"];
export type ConversationCursorPage = Schemas["CursorPage_ConversationSummary_"];
export type ConversationPropertyContext = Schemas["ConversationPropertyContext"];
export type ConversationQnAState = Schemas["ConversationQnAState"];
export type ConversationQnAAnswer = Schemas["ConversationQnAAnswer"];

export type MessageOut = Schemas["MessageOut"];
export type MessageCursorPage = Schemas["CursorPage_MessageOut_"];
/** Body of `POST /flatmates/conversations/{id}/messages`. `message_type` is `text` or `image`. */
export type MessageCreate = WriteBody<Schemas["MessageCreate"], "message_type">;

/** Body of `POST /flatmates/conversations/{id}/qna`. Answer keys are "0", "1", "2". */
export type QnAAnswers = Schemas["QnAAnswers"];

/** Body of `POST /flatmates/conversations`. */
export type ConversationCreate = Schemas["ConversationCreate"];
