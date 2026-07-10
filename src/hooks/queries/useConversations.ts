import {
  type InfiniteData,
  infiniteQueryOptions,
  queryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { useRef } from "react";
import { apiClient } from "@/lib/api";
import type {
  ConversationSummary,
  ConversationCursorPage,
  ConversationCreate,
  MessageOut,
  MessageCreate,
  MessageListResponse
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
  return useQuery(conversationsOptions);
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
  return useInfiniteQuery({
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
 * Keyset pagination against `GET /flatmates/conversations/{id}/messages`.
 * Backend expects `before_id` (int message id) and returns
 * `{ messages, total, has_more }` — not a CursorPage envelope.
 * Pass the oldest currently loaded message id as `before_id` for the next page.
 */
export function messagesInfiniteOptions(conversationId: number) {
  return infiniteQueryOptions({
    queryKey: ["conversations", conversationId, "messages"],
    queryFn: ({ pageParam, signal }) => {
      const query: { limit: number; before_id?: number } = {
        limit: MESSAGES_PAGE_SIZE
      };
      if (typeof pageParam === "number") {
        query.before_id = pageParam;
      }
      return apiClient.request<MessageListResponse>({
        method: "GET",
        path: `/flatmates/conversations/${conversationId}/messages`,
        query,
        signal
      });
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || lastPage.messages.length === 0) return undefined;
      // Messages are chronological; index 0 is the oldest on the page.
      return lastPage.messages[0]?.id;
    },
    enabled: conversationId > 0
  });
}

export function useMessages(conversationId: number) {
  return useInfiniteQuery(messagesInfiniteOptions(conversationId));
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
    [readonly unknown[], InfiniteData<MessageListResponse> | undefined]
  >;
}

/** Locate the single infinite-query cache entry for a conversation's messages. */
function messagePageKey(conversationId: number) {
  return {
    queryKey: ["conversations", conversationId, "messages"]
  } as const;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  // Per-hook-instance (per-tab) counter so concurrent sends in the same tab
  // don't collide. (Audit F6 #2 + #20: the previous module-level counter was
  // shared across all tabs and would race between tabs opened in the same
  // session.)
  const tempIdCounterRef = useRef(-1);

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
        InfiniteData<MessageListResponse>
      >(filter);
      const id = tempId ?? tempIdCounterRef.current--;

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

      // Append the optimistic message to every cached page; drop any prior
      // failed copy carrying the same temp id (retry path).
      for (const [key, data] of previous) {
        if (!data) continue;
        queryClient.setQueryData<InfiniteData<MessageListResponse>>(key, {
          ...data,
          pages: data.pages.map((page) => {
            const withoutTemp = page.messages.filter((m) => m.id !== id);
            return {
              ...page,
              messages: [...withoutTemp, optimistic],
              total: page.total + (withoutTemp.length === page.messages.length ? 1 : 0)
            };
          })
        });
      }

      return { tempId: id, conversationId, previous };
    },

    onError: (_err, { conversationId, payload, senderId }, context) => {
      // Keep a failed optimistic bubble so the user can retry (first send and
      // retries). Full rollback removed the only handle the UI had for retry.
      if (!context) return;
      const filter = messagePageKey(conversationId);
      const pages = queryClient.getQueriesData<
        InfiniteData<MessageListResponse>
      >(filter);
      const failed: MessageOut = {
        id: context.tempId,
        conversation_id: conversationId,
        sender_id: senderId,
        body: payload.body,
        attachment_url: payload.attachment_url,
        message_type: payload.message_type ?? "text",
        metadata: { __optimistic: true, __failed: true },
        created_at: new Date().toISOString()
      };
      if (pages.length === 0) {
        queryClient.setQueryData<InfiniteData<MessageListResponse>>(
          ["conversations", conversationId, "messages"],
          {
            pages: [
              {
                messages: [failed],
                total: 1,
                has_more: false
              }
            ],
            pageParams: [undefined]
          }
        );
        return;
      }
      for (const [key, data] of pages) {
        if (!data) {
          queryClient.setQueryData(key, {
            pages: [
              {
                messages: [failed],
                total: 1,
                has_more: false
              }
            ],
            pageParams: [undefined]
          });
          continue;
        }
        queryClient.setQueryData<InfiniteData<MessageListResponse>>(key, {
          ...data,
          pages: data.pages.map((page, index) => {
            if (index !== data.pages.length - 1) {
              return {
                ...page,
                messages: page.messages.filter((m) => m.id !== context.tempId)
              };
            }
            const withoutTemp = page.messages.filter(
              (m) => m.id !== context.tempId
            );
            return {
              ...page,
              messages: [...withoutTemp, failed],
              total: withoutTemp.length + 1
            };
          })
        });
      }
    },

    onSuccess: (serverMessage, { conversationId }, context) => {
      // Audit F6 #3: dedup guard + stable created_at sort. The previous
      // implementation always appended `serverMessage` to the end, which
      // could violate the chronological order if the server's `created_at`
      // differs from the optimistic timestamp.
      const filter = messagePageKey(conversationId);
      const pages = queryClient.getQueriesData<
        InfiniteData<MessageListResponse>
      >(filter);
      for (const [key, data] of pages) {
        if (!data) continue;
        queryClient.setQueryData<InfiniteData<MessageListResponse>>(key, {
          ...data,
          pages: data.pages.map((page) => {
            const filtered = page.messages.filter(
              (m) => m.id !== context?.tempId && m.id !== serverMessage.id
            );
            const merged = [...filtered, serverMessage];
            merged.sort((a, b) => {
              const at = a.created_at ?? "";
              const bt = b.created_at ?? "";
              if (at && bt) return at.localeCompare(bt);
              if (at) return -1;
              if (bt) return 1;
              return a.id - b.id;
            });
            return { ...page, messages: merged, total: merged.length };
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

  return useMutation<{ message: string }, Error, number, void>({
    mutationFn: (conversationId) =>
      apiClient.request<{ message: string }>({
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
