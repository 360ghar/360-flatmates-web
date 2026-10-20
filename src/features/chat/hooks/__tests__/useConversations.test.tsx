import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useConversations,
  useMessages,
  useSendMessage
} from "@/features/chat/hooks/useConversations";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useConversations hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useConversations", () => {
    it("uses query key ['conversations']", async () => {
      const mockConversations = [
        {
          id: 1,
          source: "listing_interest",
          status: "active",
          peer: { id: 202, full_name: "Aditi", mode: "open_to_both" }
        }
      ];
      mockRequest.mockResolvedValue({
        items: mockConversations,
        next_cursor: null,
        has_more: false,
        limit: 30
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useConversations(), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["conversations"]);
      expect(cache).toEqual(mockConversations);
    });

    it("requests GET /flatmates/conversations", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 30
      });

      renderHook(() => useConversations(), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/flatmates/conversations");
    });
  });

  describe("useMessages(conversationId, page)", () => {
    it("uses query key ['conversations', conversationId, 'messages']", async () => {
      const mockMessages = {
        items: [{ id: 1, body: "Hi", sender_id: 101, conversation_id: 5, message_type: "text" }],
        total: null,
        limit: 50,
        has_more: false,
        next_cursor: null
      };
      mockRequest.mockResolvedValue(mockMessages);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useMessages(5), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData([
        "conversations",
        5,
        "messages"
      ]);
      expect(cache).toBeDefined();
    });

    it("is disabled when conversationId <= 0", () => {
      mockRequest.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useMessages(0), {
        wrapper: createWrapper()
      });
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("requests GET /flatmates/conversations/{id}/messages", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        total: null,
        limit: 50,
        has_more: false,
        next_cursor: null
      });

      renderHook(() => useMessages(5), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/flatmates/conversations/5/messages");
      expect(call.query).toEqual({ limit: 50 });
    });

    it("omits cursor on the first page", async () => {
      mockRequest.mockResolvedValue({ items: [], total: null, limit: 50, has_more: false, next_cursor: null });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      // The infinite query starts without a pageParam (initialPageParam: undefined),
      // so the first request should not include `cursor`.
      renderHook(() => useMessages(5), { wrapper });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.query).toEqual({ limit: 50 });
      expect(call.query.cursor).toBeUndefined();
      expect(call.query).not.toHaveProperty("before_id");
    });

    it("sends the cursor unchanged when loading older messages", async () => {
      mockRequest
        .mockResolvedValueOnce({
          items: [
            { id: 10, body: "older", sender_id: 1, conversation_id: 5, message_type: "text" },
            { id: 20, body: "newer", sender_id: 1, conversation_id: 5, message_type: "text" }
          ],
          total: null,
          limit: 50,
          has_more: true,
          next_cursor: "opaque-cursor"
        })
        .mockResolvedValueOnce({
          items: [],
          total: null,
          limit: 50,
          has_more: false,
          next_cursor: null
        });

      const { result } = renderHook(() => useMessages(5), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await result.current.fetchNextPage();
      await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(2));

      const second = mockRequest.mock.calls[1][0];
      expect(second.query).toEqual({ limit: 50, cursor: "opaque-cursor" });
    });
  });

  describe("useSendMessage", () => {
    it("invalidates conversation messages and conversation list on success", async () => {
      mockRequest.mockResolvedValue({
        id: 100,
        conversation_id: 5,
        sender_id: 101,
        body: "Hello",
        message_type: "text"
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(() => useSendMessage(), { wrapper });

      result.current.mutate({
        conversationId: 5,
        payload: { body: "Hello" },
        senderId: 101
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // Messages use a queryKey-based invalidation to cover all page variants
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(["conversations", 5, "messages"])
        })
      );
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations"] });
    });

    it("sends POST /flatmates/conversations/{id}/messages", async () => {
      mockRequest.mockResolvedValue({
        id: 100,
        conversation_id: 5,
        sender_id: 101,
        body: "Hello",
        message_type: "text"
      });

      const { result } = renderHook(() => useSendMessage(), {
        wrapper: createWrapper()
      });

      result.current.mutate({
        conversationId: 5,
        payload: { body: "Hello" },
        senderId: 101
      });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/flatmates/conversations/5/messages");
      expect(call.body).toEqual({ body: "Hello" });
    });
  });
});
