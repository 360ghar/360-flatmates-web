import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useSwipeDeck,
  useSwipeAction,
} from "@/hooks/queries/useSwipes";

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

describe("useSwipes hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useSwipeDeck(filters)", () => {
    it("uses query key ['swipes', 'deck', filters]", async () => {
      const mockProfile = {
        id: 202,
        full_name: "Aditi",
        mode: "open_to_both",
        onboarding_completed: true
      };
      const mockResponse = {
        items: [mockProfile],
        next_cursor: null,
        has_more: false,
        limit: 20
      };
      mockRequest.mockResolvedValue(mockResponse);

      const filters = { city: "Bangalore" };
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useSwipeDeck(filters), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["swipes", "deck", filters]);
      expect(cache).toEqual([mockProfile]);
    });

    it("returns profiles array from response", async () => {
      const profiles = [
        { id: 202, full_name: "Aditi", mode: "open_to_both", onboarding_completed: true }
      ];
      mockRequest.mockResolvedValue({
        items: profiles,
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      const { result } = renderHook(() => useSwipeDeck(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(profiles);
    });

    it("requests GET /flatmates/profiles with filters", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      const filters = { city: "Bangalore", limit: 10 };
      renderHook(() => useSwipeDeck(filters), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/flatmates/profiles");
      expect(call.query).toEqual(filters);
    });
  });

  describe("useSwipeAction", () => {
    it("optimistically removes the swiped profile from the cached deck", async () => {
      // Pre-seed the deck with two profiles so we can verify the swiped one
      // disappears without a network round-trip.
      const initialDeck = [
        { id: 202, full_name: "Aditi", mode: "open_to_both", onboarding_completed: true },
        { id: 203, full_name: "Riya", mode: "open_to_both", onboarding_completed: true }
      ];
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      queryClient.setQueryData(["swipes", "deck"], initialDeck);

      mockRequest.mockResolvedValue({
        stored: true,
        action: "like",
        target_type: "user",
        did_match: true,
        match_id: 700,
        conversation_id: 800
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useSwipeAction(), { wrapper });

      result.current.mutate({
        action: "like",
        target_type: "user",
        target_user_id: 202
      });

      // The optimistic update should have removed Aditi before the mutation
      // resolves. We assert on a microtask boundary to let React flush.
      await waitFor(() => {
        const deck = queryClient.getQueryData<unknown[]>(["swipes", "deck"]);
        expect(deck?.length).toBe(1);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const deck = queryClient.getQueryData<Array<{ id: number }>>(["swipes", "deck"]);
      expect(deck).toHaveLength(1);
      expect(deck?.[0]?.id).toBe(203);
    });

    it("rolls the swiped profile back when the mutation fails", async () => {
      const initialDeck = [
        { id: 202, full_name: "Aditi", mode: "open_to_both", onboarding_completed: true }
      ];
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      queryClient.setQueryData(["swipes", "deck"], initialDeck);

      mockRequest.mockRejectedValue(new Error("network"));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useSwipeAction(), { wrapper });

      result.current.mutate({
        action: "pass",
        target_type: "user",
        target_user_id: 202
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      const deck = queryClient.getQueryData<Array<{ id: number }>>(["swipes", "deck"]);
      expect(deck).toEqual(initialDeck);
    });

    it("does not invalidate the deck on success (refill is handled by SwipeDeck's onNearEnd)", async () => {
      const smallDeck = [
        { id: 202, full_name: "Aditi", mode: "open_to_both", onboarding_completed: true },
        { id: 203, full_name: "Riya", mode: "open_to_both", onboarding_completed: true }
      ];
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      queryClient.setQueryData(["swipes", "deck"], smallDeck);

      mockRequest.mockResolvedValue({
        stored: true,
        action: "like",
        target_type: "user"
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useSwipeAction(), { wrapper });
      result.current.mutate({
        action: "like",
        target_type: "user",
        target_user_id: 202
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // The deck refill is handled entirely by SwipeDeck's onNearEnd callback,
      // not by useSwipeAction. Other affected scopes, such as incoming likes,
      // may be invalidated after a like.
      expect(invalidateSpy).not.toHaveBeenCalledWith({
        queryKey: ["swipes", "deck"],
      });
    });

    it("does not invalidate the deck when plenty of cards remain", async () => {
      const bigDeck = Array.from({ length: 10 }, (_, i) => ({
        id: 200 + i,
        full_name: `Profile ${i}`,
        mode: "open_to_both",
        onboarding_completed: true
      }));
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      queryClient.setQueryData(["swipes", "deck"], bigDeck);

      mockRequest.mockResolvedValue({
        stored: true,
        action: "pass",
        target_type: "user"
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useSwipeAction(), { wrapper });
      result.current.mutate({
        action: "pass",
        target_type: "user",
        target_user_id: 200
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      // Plenty of cards remain, so no invalidation.
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it("sends POST /flatmates/swipes", async () => {
      mockRequest.mockResolvedValue({
        stored: true,
        action: "pass",
        target_type: "profile"
      });

      const payload = {
        action: "pass" as const,
        target_type: "user" as const,
        target_user_id: 203
      };
      const { result } = renderHook(() => useSwipeAction(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/flatmates/swipes");
      expect(call.body).toEqual(payload);
    });
  });
});
