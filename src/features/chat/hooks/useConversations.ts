import { chatStore } from "@/features/chat/store";
import { useRealtimeFallbackInterval } from "@/hooks/useRealtimeFallback";
import {
  type InfiniteData,
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  ConversationSummary,
  ConversationCursorPage,
  ConversationCreate,
  MessageOut,
  MessageCreate,
  MessageCursorPage
} from "@/lib/api/types";

export const conversationsOptions = queryOptions({
  queryKey: ["conversations"],
  queryFn: async () => {
    const response = await apiClient.request<ConversationCursorPage>({
      method: "GET",
      path: "/flatmates/conversations"
    });
    // Defense-in-depth against envelope shape drift (see RCA for the
    // notifications `h?.filter is not a function` regression).
    return Array.isArray(response?.items) ? response.items : [];
  }
});

export function useConversations() {
  const refetchInterval = useRealtimeFallbackInterval("new_message");
  return useQuery({ ...conversationsOptions, refetchInterval });
}

const CONVERSATIONS_PAGE_SIZE = 30;

/**
 * Infinite cursor-paginated conversations list.
 *
 * The `/flatmates/conversations` endpoint now returns a `CursorPage<ConversationSummary>`.
 * `useConversations()` keeps returning the first page flat (for backwards-compat with
 * navigation/sidebar code that only renders the first N). For longer lists, callers
 * use this hook to grow the visible set without forcing a refetch.
 */
export function useInfiniteConversations() {
  const refetchInterval = useRealtimeFallbackInterval("new_message");
  return useInfiniteQuery({
    refetchInterval,
    queryKey: ["conversations", "infinite"],
    queryFn: async ({ pageParam, signal }) => {
      const response = await apiClient.request<ConversationCursorPage>({
        method: "GET",
        path: "/flatmates/conversations",
        query: { cursor: pageParam, limit: CONVERSATIONS_PAGE_SIZE },
        signal
      });
      return response;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryKey: ["conversations", id],
    queryFn: () =>
      apiClient.request<ConversationSummary>({
        method: "GET",
        path: `/flatmates/conversations/${id}`
      }),
    enabled: id > 0
  });
}

const MESSAGES_PAGE_SIZE = 50;

/**
 * Infinite messages query.
 *
 * `GET /flatmates/conversations/{id}/messages` is a `CursorPage`: page 1 is the
 * newest `limit` messages, and `next_cursor` leads to older ones. Inside a page
 * the messages run oldest to newest. The first page (no cursor) also marks the
 * peer's messages read. Pass the cursor back unchanged.
 */
export function messagesInfiniteOptions(conversationId: number) {
  return infiniteQueryOptions({
    queryKey: ["conversations", conversationId, "messages"],
    queryFn: ({ pageParam, signal }) =>
      apiClient.request<MessageCursorPage>({
        method: "GET",
        path: `/flatmates/conversations/${conversationId}/messages`,
        query: { cursor: pageParam, limit: MESSAGES_PAGE_SIZE },
        signal
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor ?? undefined : undefined,
    enabled: conversationId > 0
  });
}

export function useMessages(conversationId: number) {
  const refetchInterval = useRealtimeFallbackInterval("new_message");
  return useInfiniteQuery({ ...messagesInfiniteOptions(conversationId), refetchInterval });
}

interface SendMessageVars {
  conversationId: number;
  payload: MessageCreate;
  /** Caller-supplied sender id so the optimistic bubble renders on the right. */
  senderId: number;
  /** When retrying a failed message, reuse its temp id instead of minting one. */
  tempId?: number;
}

interface SendMessageContext {
  tempId: number;
  conversationId: number;
  previous: Array<
    [readonly unknown[], InfiniteData<MessageCursorPage> | undefined]
  >;
}

/** Locate the single infinite-query cache entry for a conversation's messages. */
function messagePageKey(conversationId: number) {
  return {
    queryKey: ["conversations", conversationId, "messages"]
  } as const;
}

// Negative ids mark optimistic messages. Seeded from the clock so an id is
// never reused after a remount: failed sends outlive the component in
// chatStore, and a reused id would overwrite one (W7).
let tempIdSeq = 0;
function nextTempId(): number {
  tempIdSeq = (tempIdSeq + 1) % 1000;
  return -(Date.now() * 1000 + tempIdSeq);
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation<MessageOut, Error, SendMessageVars, SendMessageContext>({
    mutationFn: ({ conversationId, payload }) =>
      apiClient.request<MessageOut>({
        method: "POST",
        path: `/flatmates/conversations/${conversationId}/messages`,
        body: payload
      }),

    onMutate: async ({ conversationId, payload, senderId, tempId }) => {
      const filter = messagePageKey(conversationId);
      await queryClient.cancelQueries(filter);

      const previous = queryClient.getQueriesData<
        InfiniteData<MessageCursorPage>
      >(filter);
      const id = tempId ?? nextTempId();
      chatStore.getState().removeFailedSend(conversationId, id);

      const optimistic: MessageOut = {
        id,
        conversation_id: conversationId,
        sender_id: senderId,
        body: payload.body,
        attachment_url: payload.attachment_url,
        message_type: payload.message_type ?? "text",
        metadata: { __optimistic: true },
        created_at: new Date().toISOString()
      };

      // Append the optimistic message to the newest page (the first one); drop
      // any prior failed copy carrying the same temp id (retry path).
      for (const [key, data] of previous) {
        if (!data) continue;
        queryClient.setQueryData<InfiniteData<MessageCursorPage>>(key, {
          ...data,
          pages: data.pages.map((page, index) =>
            index === 0
              ? { ...page, items: [...page.items.filter((m) => m.id !== id), optimistic] }
              : page
          )
        });
      }

      return { tempId: id, conversationId, previous };
    },

    onError: (_err, { conversationId, payload, senderId }, context) => {
      // Move the bubble out of the query cache into chatStore: a refetch
      // (realtime event, fallback polling) would otherwise erase the text.
      if (!context) return;
      for (const [key, data] of queryClient.getQueriesData<
        InfiniteData<MessageCursorPage>
      >(messagePageKey(conversationId))) {
        if (!data) continue;
        queryClient.setQueryData<InfiniteData<MessageCursorPage>>(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.filter((m) => m.id !== context.tempId)
          }))
        });
      }
      chatStore.getState().addFailedSend({
        id: context.tempId,
        conversation_id: conversationId,
        sender_id: senderId,
        body: payload.body,
        attachment_url: payload.attachment_url,
        message_type: payload.message_type ?? "text",
        metadata: { __optimistic: true, __failed: true },
        created_at: new Date().toISOString()
      });
    },

    onSuccess: (serverMessage, { conversationId }, context) => {
      // Audit F6 #3: dedup guard + stable created_at sort. The previous
      // implementation always appended `serverMessage` to the end, which
      // could violate the chronological order if the server's `created_at`
      // differs from the optimistic timestamp.
      const filter = messagePageKey(conversationId);
      const pages = queryClient.getQueriesData<
        InfiniteData<MessageCursorPage>
      >(filter);
      for (const [key, data] of pages) {
        if (!data) continue;
        queryClient.setQueryData<InfiniteData<MessageCursorPage>>(key, {
          ...data,
          pages: data.pages.map((page, index) => {
            const filtered = page.items.filter(
              (m) => m.id !== context?.tempId && m.id !== serverMessage.id
            );
            // The sent message belongs to the newest page.
            if (index !== 0) return { ...page, items: filtered };
            const merged = [...filtered, serverMessage];
            merged.sort((a, b) => {
              const at = a.created_at;
              const bt = b.created_at;
              return at === bt ? a.id - b.id : at.localeCompare(bt);
            });
            return { ...page, items: merged };
          })
        });
      }
    },

    onSettled: (_data, error, { conversationId }) => {
      if (error) return;
      queryClient.invalidateQueries(messagePageKey(conversationId));
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConversationCreate) =>
      apiClient.request<ConversationSummary>({
        method: "POST",
        path: "/flatmates/conversations",
        body: payload
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
}

/**
 * Mark a conversation as read (audit F6 #4).
 *
 * The id is supplied at `mutate` time so a single hook instance can mark any
 * row (e.g. on conversation-list click in `ChatsPage`).
 *
 * Calls `POST /flatmates/conversations/{id}/mark-read` and optimistically
 * zeroes the `unread_count` on the matching row in the `["conversations"]`
 * cache so the bell badge updates without a refetch round-trip.
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, void>({
    // 204, no body.
    mutationFn: (conversationId) =>
      apiClient.request<void>({
        method: "POST",
        path: `/flatmates/conversations/${conversationId}/mark-read`
      }),
    onMutate: (conversationId) => {
      const zeroUnread = (c: ConversationSummary) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c;

      queryClient.setQueryData<ConversationSummary[]>(
        ["conversations"],
        (old) => (old ? old.map(zeroUnread) : old)
      );
      // Keep infinite inbox rows in sync with the first-page cache.
      queryClient.setQueriesData<InfiniteData<ConversationCursorPage>>(
        { queryKey: ["conversations", "infinite"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map(zeroUnread)
            }))
          };
        }
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
}
