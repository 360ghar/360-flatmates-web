import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useWebSearch,
  useSavedSearches,
  useCreateSavedSearch
} from "@/hooks/queries/useSearch";

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

describe("useSearch hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useWebSearch(filters)", () => {
    it("uses query key ['search', 'web', filters]", async () => {
      const rawApiResponse = {
        properties: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
        filters_applied: undefined,
        search_center: undefined
      };
      const expectedCache = {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
        search_type: "listings",
        filters_applied: undefined,
        search_center: undefined
      };
      mockRequest.mockResolvedValue(rawApiResponse);

      const filters = { q: "HSR", city: "Bangalore" };
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useWebSearch(filters), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["search", "web", filters]);
      expect(cache).toEqual(expectedCache);
    });

    it("is disabled when all filters are empty", () => {
      mockRequest.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(
        () => useWebSearch({}),
        { wrapper: createWrapper() }
      );
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("is enabled when at least one filter has a value", async () => {
      mockRequest.mockResolvedValue({
        properties: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0
      });

      renderHook(
        () => useWebSearch({ q: "HSR" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    });

    it("requests GET /properties with filters", async () => {
      mockRequest.mockResolvedValue({
        properties: [],
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0
      });

      const filters = { q: "Koramangala" };
      renderHook(() => useWebSearch(filters), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/properties");
    });
  });

  describe("useSavedSearches", () => {
    it("uses query key ['search', 'saved']", async () => {
      const mockSearches = [
        { id: 401, name: "Test Search", filters: {}, alert_enabled: true, alert_frequency: "daily", alert_channels: ["in_app"] }
      ];
      mockRequest.mockResolvedValue(mockSearches);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useSavedSearches(), { wrapper });
      await act(async () => {
        await result.current.refetch();
      });

      const cache = queryClient.getQueryData(["search", "saved"]);
      expect(cache).toEqual(mockSearches);
    });

    it("requests GET /flatmates/web/saved-searches", async () => {
      mockRequest.mockResolvedValue([]);

      const { result } = renderHook(() => useSavedSearches(), { wrapper: createWrapper() });
      await act(async () => {
        await result.current.refetch();
      });

      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/flatmates/web/saved-searches");
    });
  });

  describe("useCreateSavedSearch", () => {
    it("invalidates ['search', 'saved'] on success", async () => {
      mockRequest.mockResolvedValue({
        id: 900,
        name: "New Search",
        filters: {},
        alert_enabled: false,
        alert_frequency: "daily",
        alert_channels: ["in_app"]
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
      const { result } = renderHook(() => useCreateSavedSearch(), { wrapper });

      result.current.mutate({
        name: "HSR under 30k",
        filters: { q: "HSR", city: "Bangalore", price_max: 30000 }
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["search", "saved"] });
    });

    it("sends POST /flatmates/web/saved-searches", async () => {
      mockRequest.mockResolvedValue({ id: 1, name: "Test" });

      const payload = {
        name: "Test Search",
        filters: { q: "HSR" }
      };
      const { result } = renderHook(() => useCreateSavedSearch(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/flatmates/web/saved-searches");
      expect(call.body).toEqual(payload);
    });
  });
});
