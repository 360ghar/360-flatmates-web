import { beforeEach, describe, expect, it } from "vitest";
import { chatStore } from "@/features/chat/store";
import type { MessageOut } from "@/lib/api/types";

const failed = (id: number, conversation_id = 7): MessageOut => ({
  id,
  conversation_id,
  sender_id: 1,
  body: `hello ${id}`,
  message_type: "text",
  metadata: { __failed: true },
  created_at: "2026-09-25T10:00:00Z"
});

// W7 regression: failed sends survive outside the query cache.
describe("chatStore failed sends", () => {
  beforeEach(() => chatStore.getState().reset());

  it("adds, replaces by temp id, and removes", () => {
    chatStore.getState().addFailedSend(failed(-1));
    chatStore.getState().addFailedSend(failed(-1));
    chatStore.getState().addFailedSend(failed(-2));
    expect(chatStore.getState().failedSends[7].map((m) => m.id)).toEqual([-1, -2]);
    chatStore.getState().removeFailedSend(7, -1);
    expect(chatStore.getState().failedSends[7].map((m) => m.id)).toEqual([-2]);
  });

  it("reset clears every conversation", () => {
    chatStore.getState().addFailedSend(failed(-1, 3));
    chatStore.getState().reset();
    expect(chatStore.getState().failedSends).toEqual({});
  });
});
