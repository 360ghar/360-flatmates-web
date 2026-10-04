import { createStore } from "zustand/vanilla";
import type { MessageOut } from "@/lib/api/types";

/** Messages whose send failed, per conversation. Kept outside the query
 *  cache so a refetch or leaving the chat never drops the user's text. */
export interface ChatStoreState {
  failedSends: Record<number, MessageOut[]>;
  addFailedSend: (message: MessageOut) => void;
  removeFailedSend: (conversationId: number, tempId: number) => void;
  reset: () => void;
}

export const chatStore = createStore<ChatStoreState>()((set) => ({
  failedSends: {},
  addFailedSend: (message) =>
    set((state) => {
      const list = (state.failedSends[message.conversation_id] ?? []).filter(
        (m) => m.id !== message.id
      );
      return {
        failedSends: { ...state.failedSends, [message.conversation_id]: [...list, message] }
      };
    }),
  removeFailedSend: (conversationId, tempId) =>
    set((state) => {
      const list = state.failedSends[conversationId];
      if (!list?.some((m) => m.id === tempId)) return state;
      return {
        failedSends: {
          ...state.failedSends,
          [conversationId]: list.filter((m) => m.id !== tempId)
        }
      };
    }),
  reset: () => set({ failedSends: {} })
}));
