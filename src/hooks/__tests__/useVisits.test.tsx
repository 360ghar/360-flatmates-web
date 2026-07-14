import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useVisits,
  useCreateVisit,
  useCancelVisit,
  useUpdateVisit
} from "@/hooks/queries/useVisits";
import type { Visit, VisitUpdate } from "@/lib/api/types";

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

describe("useVisits hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useVisits(filters)", () => {
    it("uses query key ['visits', filters]", async () => {
      const mockVisits = {
        items: [
          {
            id: 1,
            property_id: 301,
            visit_context: "property_tour",
            scheduled_date: "2026-06-01",
            status: "confirmed"
          }
        ],
        next_cursor: null,
        has_more: false,
        limit: 20,
        total: 1
      };
      mockRequest.mockResolvedValue(mockVisits);

      const filters = { status: "confirmed" as const };
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useVisits(filters), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      // useVisits extracts response.items and stores that as the cached value.
      const cache = queryClient.getQueryData(["visits", filters]);
      expect(cache).toEqual(mockVisits.items);
    });

    it("requests GET /visits with filters", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 10
      });

      const filters = { upcoming: true, limit: 10 };
      renderHook(() => useVisits(filters), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("GET");
      expect(call.path).toBe("/visits");
      expect(call.query).toEqual(filters);
    });

    it("works without filters", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      renderHook(() => useVisits(), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.path).toBe("/visits");
    });
  });

  describe("useCreateVisit", () => {
    it("invalidates ['visits'] on success", async () => {
      mockRequest.mockResolvedValue({
        id: 10,
        property_id: 301,
        visit_context: "property_tour",
        scheduled_date: "2026-06-01",
        status: "requested"
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
      const { result } = renderHook(() => useCreateVisit(), { wrapper });

      result.current.mutate({
        property_id: 301,
        scheduled_date: "2026-06-01"
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["visits"] });
    });

    it("sends POST /visits", async () => {
      mockRequest.mockResolvedValue({
        id: 10,
        property_id: 301,
        visit_context: "property_tour",
        scheduled_date: "2026-06-01",
        status: "requested"
      });

      const payload = {
        property_id: 301,
        scheduled_date: "2026-06-01",
        visit_context: "property_tour" as const
      };
      const { result } = renderHook(() => useCreateVisit(), {
        wrapper: createWrapper()
      });

      result.current.mutate(payload);

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/visits");
      expect(call.body).toEqual(payload);
    });
  });

  describe("useCancelVisit(id)", () => {
    it("invalidates ['visits'] on success", async () => {
      mockRequest.mockResolvedValue({
        id: 10,
        property_id: 301,
        visit_context: "property_tour",
        scheduled_date: "2026-06-01",
        status: "cancelled"
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
      const { result } = renderHook(() => useCancelVisit(10), { wrapper });

      result.current.mutate({ reason: "Schedule conflict" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["visits"] });
    });

    it("sends POST /visits/{id}/cancel", async () => {
      mockRequest.mockResolvedValue({
        id: 10,
        property_id: 301,
        visit_context: "property_tour",
        scheduled_date: "2026-06-01",
        status: "cancelled"
      });

      const { result } = renderHook(() => useCancelVisit(10), {
        wrapper: createWrapper()
      });

      result.current.mutate({ reason: "Conflict" });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.method).toBe("POST");
      expect(call.path).toBe("/visits/10/cancel");
    });
  });

  describe("useUpdateVisit(id) routing", () => {
    it("calls PUT /flatmates/visits/{id} for flatmate_meet and does not seed Visit cache", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const cached: Partial<Visit> = {
        id: 10,
        visit_context: "flatmate_meet",
        status: "requested"
      };
      queryClient.setQueryData(["visits", 10], cached);

      mockRequest.mockResolvedValue({ id: 10, status: "confirmed", updated: true });

      const setSpy = vi.spyOn(queryClient, "setQueryData");
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateVisit(10), { wrapper });
      const payload: VisitUpdate = { status: "confirmed" };
      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          path: "/flatmates/visits/10",
          body: payload
        })
      );
      // Flatmate ack must not overwrite the detail cache as a Visit.
      expect(setSpy).not.toHaveBeenCalledWith(
        ["visits", 10],
        expect.objectContaining({ updated: true })
      );
    });

    it("calls PUT /visits/{id} for property_tour and seeds Visit cache", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const cached: Partial<Visit> = {
        id: 20,
        visit_context: "property_tour",
        status: "requested"
      };
      queryClient.setQueryData(["visits", 20], cached);

      const updated: Visit = {
        id: 20,
        property_id: 1,
        visit_context: "property_tour",
        scheduled_date: "2026-06-01",
        status: "confirmed"
      } as Visit;
      mockRequest.mockResolvedValue(updated);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateVisit(20), { wrapper });
      const payload: VisitUpdate = { status: "confirmed" };
      result.current.mutate(payload);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "PUT",
          path: "/visits/20",
          body: payload
        })
      );
      expect(queryClient.getQueryData(["visits", 20])).toEqual(updated);
    });

    it("fetches visit on cold cache then routes flatmate_meet correctly", async () => {
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const fetched: Visit = {
        id: 30,
        property_id: 1,
        visit_context: "flatmate_meet",
        scheduled_date: "2026-06-01",
        status: "requested"
      } as Visit;

      mockRequest
        .mockResolvedValueOnce(fetched)
        .mockResolvedValueOnce({ id: 30, status: "confirmed", updated: true });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const { result } = renderHook(() => useUpdateVisit(30), { wrapper });
      result.current.mutate({ status: "confirmed" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockRequest).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ method: "GET", path: "/visits/30" })
      );
      expect(mockRequest).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ method: "PUT", path: "/flatmates/visits/30" })
      );
    });
  });
});
