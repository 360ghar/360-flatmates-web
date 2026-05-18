import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type {
  ConversationSummary,
  ConversationCreate,
  MessageOut,
  MessageCreate,
  MessageListResponse
} from "@/lib/api/types";

export const conversationsOptions = queryOptions({
  queryKey: ["conversations"],
  queryFn: () =>
    apiClient.request<ConversationSummary[]>({
      method: "GET",
      path: "/flatmates/conversations"
    })
});

export function useConversations() {
  return useQuery(conversationsOptions);
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

export function useMessages(conversationId: number, page?: number) {
  return useQuery({
    queryKey: ["conversations", conversationId, "messages", page],
    queryFn: () =>
      apiClient.request<MessageListResponse>({
        method: "GET",
        path: `/flatmates/conversations/${conversationId}/messages`,
        query: page ? { page } : undefined
      }),
    enabled: conversationId > 0
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      payload
    }: {
      conversationId: number;
      payload: MessageCreate;
    }) =>
      apiClient.request<MessageOut>({
        method: "POST",
        path: `/flatmates/conversations/${conversationId}/messages`,
        body: payload
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.conversationId, "messages"]
      });
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
