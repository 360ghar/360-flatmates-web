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
      const mockResponse = [
        { id: 202, full_name: "Aditi", mode: "open_to_both", onboarding_completed: true }
      ];
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
      expect(cache).toEqual(mockResponse);
    });

    it("returns profiles array from response", async () => {
      const profiles = [
        { id: 202, full_name: "Aditi", mode: "open_to_both", onboarding_completed: true }
      ];
      mockRequest.mockResolvedValue(profiles);

      const { result } = renderHook(() => useSwipeDeck(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(profiles);
    });

    it("requests GET /flatmates/profiles with filters", async () => {
      mockRequest.mockResolvedValue([]);

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
    it("invalidates ['swipes', 'deck'] on success", async () => {
      mockRequest.mockResolvedValue({
        stored: true,
        action: "like",
        target_type: "profile",
        did_match: true,
        match_id: 700,
        conversation_id: 800
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
      const { result } = renderHook(() => useSwipeAction(), { wrapper });

      result.current.mutate({
        action: "like",
        target_type: "user",
        target_user_id: 202
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["swipes", "deck"] });
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
