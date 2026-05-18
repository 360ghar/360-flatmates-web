import { create } from "zustand";

export interface ChatStoreState {
  activeConversationId: number | null;
  draftMessages: Record<number, string>;
  isTyping: Record<number, boolean>;
  showInfoPanel: boolean;
  setActiveConversation: (id: number) => void;
  clearActiveConversation: () => void;
  getDraftMessage: (conversationId: number) => string;
  setDraftMessage: (conversationId: number, message: string) => void;
  clearDraftMessage: (conversationId: number) => void;
  setTyping: (conversationId: number, typing: boolean) => void;
  setShowInfoPanel: (show: boolean) => void;
}

export const useChatStore = create<ChatStoreState>()((set, get) => ({
  activeConversationId: null,
  draftMessages: {},
  isTyping: {},
  showInfoPanel: false,

  setActiveConversation: (id) => set({ activeConversationId: id }),
  clearActiveConversation: () => set({ activeConversationId: null }),

  getDraftMessage: (conversationId) =>
    get().draftMessages[conversationId] ?? "",

  setDraftMessage: (conversationId, message) =>
    set((state) => {
      if (state.draftMessages[conversationId] === message) return state;
      return { draftMessages: { ...state.draftMessages, [conversationId]: message } };
    }),

  clearDraftMessage: (conversationId) =>
    set((state) => {
      const rest = { ...state.draftMessages };
      delete rest[conversationId];
      return { draftMessages: rest };
    }),

  setTyping: (conversationId, typing) =>
    set((state) => {
      if (state.isTyping[conversationId] === typing) return state;
      return { isTyping: { ...state.isTyping, [conversationId]: typing } };
    }),

  setShowInfoPanel: (showInfoPanel) => set({ showInfoPanel })
}));
