import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useMatches,
  useUnmatchMutation,
  outgoingLikesInfiniteOptions
} from "@/hooks/queries/useMatches";
import type { MatchSummary } from "@/lib/api/types";

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

describe("useMatches hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMatches", () => {
    it("uses query key ['matches']", async () => {
      const mockMatches: MatchSummary[] = [
        {
          id: 1,
          status: "active",
          peer: {
            id: 10,
            full_name: "Test User",
            mode: "room_poster"
          }
        }
      ];
      mockRequest.mockResolvedValue({
        items: mockMatches,
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useMatches(), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["matches"]);
      expect(cache).toEqual(mockMatches);
    });

    it("requests GET /flatmates/matches", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      renderHook(() => useMatches(), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/flatmates/matches");
    });
  });

  describe("useUnmatchMutation", () => {
    it("sends PUT /flatmates/matches/{id}/unmatch", async () => {
      mockRequest.mockResolvedValue({ message: "Unmatched" });

      const { result } = renderHook(() => useUnmatchMutation(), {
        wrapper: createWrapper()
      });

      result.current.mutate(42);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("PUT");
      expect(call.path).toBe("/flatmates/matches/42/unmatch");
    });

    it("invalidates ['matches'] and ['conversations'] on success", async () => {
      mockRequest.mockResolvedValue({ message: "Unmatched" });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(() => useUnmatchMutation(), { wrapper });

      result.current.mutate(7);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["matches"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations"] });
    });
  });

  describe("outgoingLikesInfiniteOptions", () => {
    it("requests GET /flatmates/outgoing-likes", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      const options = outgoingLikesInfiniteOptions();
      const queryFn = options.queryFn;
      expect(queryFn).toBeDefined();

      await queryFn!({
        pageParam: undefined,
        signal: new AbortController().signal,
        queryKey: options.queryKey,
        direction: "forward",
        meta: undefined
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          path: "/flatmates/outgoing-likes"
        })
      );
    });
  });
});
