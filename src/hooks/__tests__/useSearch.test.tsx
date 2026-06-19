import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// The saved-searches and search-alerts hooks are localStorage-backed now
// (the backend does not expose those endpoints). The web-search hook still
// hits the network, so we keep the apiClient mock for that flow only.
const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useWebSearch,
  useSavedSearches,
  useCreateSavedSearch
} from "@/hooks/queries/useSearch";
import {
  SAVED_SEARCHES_KEY,
  SEARCH_ALERTS_KEY
} from "@/lib/storage/saved-searches";

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
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  describe("useWebSearch(filters)", () => {
    it("uses query key ['search', 'web', filters]", async () => {
      const rawApiResponse = {
        items: [],
        total: 0,
        next_cursor: null,
        has_more: false,
        limit: 20,
        filters_applied: undefined,
        search_center: undefined
      };
      const expectedCache = {
        results: [],
        total: 0,
        next_cursor: null,
        has_more: false,
        limit: 20,
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
        items: [],
        total: 0,
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      renderHook(
        () => useWebSearch({ q: "HSR" }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    });

    it("requests GET /properties with filters", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        total: 0,
        next_cursor: null,
        has_more: false,
        limit: 20
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
    it("uses query key ['search', 'saved'] and reads from localStorage", async () => {
      const stored = [
        {
          id: 401,
          user_id: 0,
          name: "Test Search",
          filters: {},
          alert_enabled: true,
          alert_frequency: "daily",
          alert_channels: ["in_app"]
        }
      ];
      window.localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(stored));

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useSavedSearches(), { wrapper });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const cache = queryClient.getQueryData(["search", "saved"]);
      expect(cache).toEqual([
        expect.objectContaining({ id: 401, name: "Test Search" })
      ]);
      // Local-storage backed, so no network call should fire.
      expect(mockRequest).not.toHaveBeenCalled();
    });

    it("returns an empty list when localStorage is empty", async () => {
      const { result } = renderHook(() => useSavedSearches(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([]);
    });
  });

  describe("useCreateSavedSearch", () => {
    it("invalidates ['search', 'saved'] on success", async () => {
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
      // Persisted to localStorage under the namespaced key.
      const raw = window.localStorage.getItem(SAVED_SEARCHES_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed[0]).toMatchObject({
        name: "HSR under 30k",
        filters: { q: "HSR", city: "Bangalore", price_max: 30000 }
      });
    });

    it("does not hit the network", async () => {
      const { result } = renderHook(() => useCreateSavedSearch(), {
        wrapper: createWrapper()
      });

      result.current.mutate({
        name: "Local Save",
        filters: { q: "HSR" }
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockRequest).not.toHaveBeenCalled();
    });
  });
});

// Silence unused import warning for the alerts key (exported so consumers
// that want to clear storage can do so without hard-coding the string).
void SEARCH_ALERTS_KEY;
