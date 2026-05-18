import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import { useMapView } from "@/hooks/queries/useMapView";
import type { MapViewResponse } from "@/lib/api/types";

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

describe("useMapView hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMapView(filters)", () => {
    it("uses query key ['map', filters]", async () => {
      const rawApiResponse = {
        properties: [],
        total: 0,
        page: 1,
        limit: 100,
        total_pages: 0
      };
      const expectedCache: MapViewResponse = {
        clusters: [],
        pins: [],
        total_listings: 0
      };
      mockRequest.mockResolvedValue(rawApiResponse);

      const filters = { lat: 12.97, lng: 77.59 };
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useMapView(filters), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["map", filters]);
      expect(cache).toEqual(expectedCache);
    });

    it("requests GET /properties with filters as query", async () => {
      mockRequest.mockResolvedValue({
        properties: [],
        total: 0,
        page: 1,
        limit: 100,
        total_pages: 0
      });

      const filters = { lat: 12.97, lng: 77.59, radius: 5 };
      renderHook(() => useMapView(filters), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/properties");
      expect(call.query).toMatchObject({ lat: 12.97, lng: 77.59, radius: 5 });
    });

    it("is enabled when lat and lng are defined", async () => {
      mockRequest.mockResolvedValue({
        clusters: [],
        pins: [],
        total_listings: 0
      });

      const { result } = renderHook(
        () => useMapView({ lat: 12.97, lng: 77.59 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      expect(result.current.fetchStatus).toBe("fetching");
    });

    it("is disabled when lat is undefined", () => {
      mockRequest.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(
        () => useMapView({ lat: undefined as unknown as number, lng: 77.59 }),
        { wrapper: createWrapper() }
      );
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("is disabled when lng is undefined", () => {
      mockRequest.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(
        () => useMapView({ lat: 12.97, lng: undefined as unknown as number }),
        { wrapper: createWrapper() }
      );
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("is disabled when both lat and lng are undefined", () => {
      mockRequest.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(
        () =>
          useMapView({
            lat: undefined as unknown as number,
            lng: undefined as unknown as number
          }),
        { wrapper: createWrapper() }
      );
      expect(result.current.fetchStatus).toBe("idle");
    });
  });
});
