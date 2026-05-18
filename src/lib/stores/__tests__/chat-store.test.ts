import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore } from "../chat-store";

describe("useChatStore", () => {
  beforeEach(() => {
    useChatStore.setState(useChatStore.getInitialState());
  });

  it("should have correct initial state", () => {
    const state = useChatStore.getState();
    expect(state.activeConversationId).toBeNull();
    expect(state.draftMessages).toEqual({});
    expect(state.isTyping).toEqual({});
    expect(state.showInfoPanel).toBe(false);
  });

  it("setActiveConversation sets activeConversationId", () => {
    useChatStore.getState().setActiveConversation(42);
    expect(useChatStore.getState().activeConversationId).toBe(42);
  });

  it("clearActiveConversation sets activeConversationId to null", () => {
    useChatStore.getState().setActiveConversation(42);
    useChatStore.getState().clearActiveConversation();
    expect(useChatStore.getState().activeConversationId).toBeNull();
  });

  it("getDraftMessage returns empty string when not set", () => {
    expect(useChatStore.getState().getDraftMessage(1)).toBe("");
  });

  it("getDraftMessage returns the stored message", () => {
    useChatStore.getState().setDraftMessage(1, "Hello there");
    expect(useChatStore.getState().getDraftMessage(1)).toBe("Hello there");
  });

  it("setDraftMessage sets a draft message for a conversation", () => {
    useChatStore.getState().setDraftMessage(5, "Hey!");
    expect(useChatStore.getState().draftMessages[5]).toBe("Hey!");
  });

  it("clearDraftMessage removes a draft message for a conversation", () => {
    useChatStore.getState().setDraftMessage(5, "Hey!");
    useChatStore.getState().clearDraftMessage(5);
    expect(useChatStore.getState().draftMessages[5]).toBeUndefined();
  });

  it("clearDraftMessage does not affect other conversations", () => {
    useChatStore.getState().setDraftMessage(1, "First");
    useChatStore.getState().setDraftMessage(2, "Second");
    useChatStore.getState().clearDraftMessage(1);
    expect(useChatStore.getState().draftMessages[1]).toBeUndefined();
    expect(useChatStore.getState().draftMessages[2]).toBe("Second");
  });

  it("setTyping sets typing state for a conversation", () => {
    useChatStore.getState().setTyping(10, true);
    expect(useChatStore.getState().isTyping[10]).toBe(true);

    useChatStore.getState().setTyping(10, false);
    expect(useChatStore.getState().isTyping[10]).toBe(false);
  });

  it("setShowInfoPanel sets showInfoPanel directly", () => {
    useChatStore.getState().setShowInfoPanel(true);
    expect(useChatStore.getState().showInfoPanel).toBe(true);

    useChatStore.getState().setShowInfoPanel(false);
    expect(useChatStore.getState().showInfoPanel).toBe(false);
  });
});
