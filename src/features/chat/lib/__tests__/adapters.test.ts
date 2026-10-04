import { describe, it, expect } from "vitest";
import { messageToChatBubbleProps } from "../adapters";
import type { MessageOut } from "@/lib/api/types";

describe("messageToChatBubbleProps", () => {
  it("detects own messages when sender_id matches currentUserId", () => {
    const message = {
      id: 100,
      conversation_id: 5,
      sender_id: 101,
      body: "Hello",
      message_type: "text",
      created_at: "2026-05-16T10:00:00Z"
    } as MessageOut;

    const result = messageToChatBubbleProps(message, 101);
    expect(result.sender).toBe("me");
    expect(result.status).toBe("sent");
  });

  it("detects peer messages when sender_id differs", () => {
    const message = {
      id: 101,
      conversation_id: 5,
      sender_id: 202,
      body: "Hi there",
      message_type: "text",
      created_at: "2026-05-16T10:01:00Z"
    } as MessageOut;

    const result = messageToChatBubbleProps(message, 101);
    expect(result.sender).toBe("them");
    expect(result.status).toBeUndefined();
  });

  it("sets status to read for own messages with read_at", () => {
    const message = {
      id: 102,
      conversation_id: 5,
      sender_id: 101,
      body: "Read message",
      message_type: "text",
      read_at: "2026-05-16T11:00:00Z",
      created_at: "2026-05-16T10:00:00Z"
    } as MessageOut;

    const result = messageToChatBubbleProps(message, 101);
    expect(result.status).toBe("read");
  });

  it("converts number ID to string", () => {
    const message = {
      id: 999,
      conversation_id: 5,
      sender_id: 202,
      body: "Test",
      message_type: "text",
      created_at: "2026-05-16T10:00:00Z"
    } as MessageOut;

    const result = messageToChatBubbleProps(message, 101);
    expect(result.id).toBe("999");
    expect(typeof result.id).toBe("string");
  });
});
