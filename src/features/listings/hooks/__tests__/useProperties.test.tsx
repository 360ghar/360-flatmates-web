import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useProperty,
  useMyProperties,
  useCreateProperty
} from "@/features/listings/hooks/useProperties";
import type { Property } from "@/lib/api/types";

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

describe("useProperties hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useProperty(id)", () => {
    it("is enabled when id > 0", async () => {
      const mockProperty: Property = {
        id: 301,
        property_type: "flatmate",
        purpose: "rent",
        title: "Test Room",
        city: "Bangalore",
        locality: "Indiranagar",
        monthly_rent: 28500
      };
      mockRequest.mockResolvedValue(mockProperty);

      renderHook(() => useProperty(301), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    });

    it("is disabled when id <= 0", () => {
      mockRequest.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useProperty(0), {
        wrapper: createWrapper()
      });
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("uses query key ['properties', id]", async () => {
      const mockProperty: Property = {
        id: 42,
        property_type: "flatmate",
        purpose: "rent",
        title: "Room",
        city: "Bangalore",
        locality: "HSR",
        monthly_rent: 20000
      };
      mockRequest.mockResolvedValue(mockProperty);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useProperty(42), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["properties", 42]);
      expect(cache).toEqual(mockProperty);
    });

    it("requests GET /properties/{id}", async () => {
      mockRequest.mockResolvedValue({ id: 10, title: "Test" });

      renderHook(() => useProperty(10), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/properties/10");
    });
  });

  describe("useMyProperties", () => {
    it("uses query key ['properties', 'mine']", async () => {
      const mockProperties: Property[] = [
        {
          id: 301,
          property_type: "flatmate",
          purpose: "rent",
          title: "Room 1",
          city: "Bangalore",
          locality: "Indiranagar",
          monthly_rent: 25000
        }
      ];
      mockRequest.mockResolvedValue({
        items: mockProperties,
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

      renderHook(() => useMyProperties(), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["properties", "mine"]);
      expect(cache).toEqual(mockProperties);
    });

    it("requests GET /properties/me", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      renderHook(() => useMyProperties(), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/properties/me");
    });
  });

  describe("useCreateProperty", () => {
    it("invalidates ['properties', 'mine'] on success", async () => {
      mockRequest.mockResolvedValue({
        id: 999,
        title: "New Property",
        property_type: "flatmate",
        purpose: "rent",
        city: "Bangalore",
        locality: "HSR",
        monthly_rent: 15000
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
      const { result } = renderHook(() => useCreateProperty(), { wrapper });

      result.current.mutate({
        property_type: "flatmate",
        purpose: "rent",
        title: "New Property",
        city: "Bangalore",
        locality: "HSR",
        monthly_rent: 15000
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["properties", "mine"] });
    });

    it("sends POST /properties", async () => {
      mockRequest.mockResolvedValue({ id: 1, title: "Test" });

      const payload = {
        property_type: "flatmate" as const,
        purpose: "rent" as const,
        title: "Test",
        city: "Bangalore",
        locality: "HSR",
        monthly_rent: 15000
      };
      const { result } = renderHook(() => useCreateProperty(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/properties");
      expect(call.body).toEqual(payload);
    });
  });
});
