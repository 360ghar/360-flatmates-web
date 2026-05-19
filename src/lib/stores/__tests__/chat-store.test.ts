import { describe, it, expect, beforeEach } from "vitest";
import { chatStore } from "../chat-store";

describe("chatStore", () => {
  beforeEach(() => {
    chatStore.setState(chatStore.getInitialState());
  });

  it("should have correct initial state", () => {
    const state = chatStore.getState();
    expect(state.activeConversationId).toBeNull();
    expect(state.draftMessages).toEqual({});
    expect(state.isTyping).toEqual({});
    expect(state.showInfoPanel).toBe(false);
  });

  it("setActiveConversation sets activeConversationId", () => {
    chatStore.getState().setActiveConversation(42);
    expect(chatStore.getState().activeConversationId).toBe(42);
  });

  it("clearActiveConversation sets activeConversationId to null", () => {
    chatStore.getState().setActiveConversation(42);
    chatStore.getState().clearActiveConversation();
    expect(chatStore.getState().activeConversationId).toBeNull();
  });

  it("getDraftMessage returns empty string when not set", () => {
    expect(chatStore.getState().getDraftMessage(1)).toBe("");
  });

  it("getDraftMessage returns the stored message", () => {
    chatStore.getState().setDraftMessage(1, "Hello there");
    expect(chatStore.getState().getDraftMessage(1)).toBe("Hello there");
  });

  it("setDraftMessage sets a draft message for a conversation", () => {
    chatStore.getState().setDraftMessage(5, "Hey!");
    expect(chatStore.getState().draftMessages[5]).toBe("Hey!");
  });

  it("clearDraftMessage removes a draft message for a conversation", () => {
    chatStore.getState().setDraftMessage(5, "Hey!");
    chatStore.getState().clearDraftMessage(5);
    expect(chatStore.getState().draftMessages[5]).toBeUndefined();
  });

  it("clearDraftMessage does not affect other conversations", () => {
    chatStore.getState().setDraftMessage(1, "First");
    chatStore.getState().setDraftMessage(2, "Second");
    chatStore.getState().clearDraftMessage(1);
    expect(chatStore.getState().draftMessages[1]).toBeUndefined();
    expect(chatStore.getState().draftMessages[2]).toBe("Second");
  });

  it("setTyping sets typing state for a conversation", () => {
    chatStore.getState().setTyping(10, true);
    expect(chatStore.getState().isTyping[10]).toBe(true);

    chatStore.getState().setTyping(10, false);
    expect(chatStore.getState().isTyping[10]).toBe(false);
  });

  it("setShowInfoPanel sets showInfoPanel directly", () => {
    chatStore.getState().setShowInfoPanel(true);
    expect(chatStore.getState().showInfoPanel).toBe(true);

    chatStore.getState().setShowInfoPanel(false);
    expect(chatStore.getState().showInfoPanel).toBe(false);
  });
});
