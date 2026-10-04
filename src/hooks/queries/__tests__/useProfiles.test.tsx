import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockRequest = vi.fn();
vi.mock("@/lib/api", () => ({
  apiClient: { request: (...args: unknown[]) => mockRequest(...args) }
}));

import {
  useMyProfile,
  useProfile,
  usePeers,
  useUpdateProfile
} from "@/hooks/queries/useProfiles";
import type { FlatmatesProfile } from "@/lib/api/types";

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

describe("useProfiles hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useMyProfile", () => {
    it("uses query key ['profile', 'me']", async () => {
      const mockProfile: FlatmatesProfile = {
        id: 101,
        full_name: "Priya Nair",
        mode: "co_hunter",
        onboarding_completed: true
      };
      mockRequest.mockResolvedValue(mockProfile);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useMyProfile(), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["profile", "me"]);
      expect(cache).toEqual(mockProfile);
    });

    it("starts in loading state", () => {
      mockRequest.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper()
      });
      expect(result.current.isLoading).toBe(true);
    });

    it("returns data on success", async () => {
      const mockProfile: FlatmatesProfile = {
        id: 101,
        full_name: "Priya Nair",
        mode: "co_hunter",
        onboarding_completed: true
      };
      mockRequest.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockProfile);
    });

    it("returns error on failure", async () => {
      mockRequest.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useMyProfile(), {
        wrapper: createWrapper()
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeDefined();
    });
  });

  describe("useProfile(id)", () => {
    it("uses query key ['profiles', id]", async () => {
      const mockProfile: FlatmatesProfile = {
        id: 202,
        full_name: "Aditi Rao",
        mode: "open_to_both",
        onboarding_completed: true
      };
      mockRequest.mockResolvedValue(mockProfile);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => useProfile(202), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["profiles", 202]);
      expect(cache).toEqual(mockProfile);
    });

    it("is disabled when id <= 0", () => {
      mockRequest.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useProfile(0), {
        wrapper: createWrapper()
      });
      expect(result.current.fetchStatus).toBe("idle");
    });

    it("is enabled when id > 0", async () => {
      mockRequest.mockResolvedValue({
        id: 5,
        full_name: "Test",
        mode: "co_hunter",
        onboarding_completed: true
      });

      renderHook(() => useProfile(5), {
        wrapper: createWrapper()
      });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
    });
  });

  describe("usePeers(filters)", () => {
    it("uses query key ['profiles', 'peers', filters]", async () => {
      const mockPeers = [
        { id: 202, full_name: "Aditi", mode: "open_to_both", onboarding_completed: true }
      ];
      mockRequest.mockResolvedValue({
        items: mockPeers,
        next_cursor: null,
        has_more: false,
        limit: 20,
        total: 1
      });

      const filters = { city: "Bangalore" };
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      renderHook(() => usePeers(filters), { wrapper });
      await waitFor(() => expect(mockRequest).toHaveBeenCalled());

      const cache = queryClient.getQueryData(["profiles", "peers", filters]);
      expect(cache).toEqual(mockPeers);
    });

    it("sends filters as query params", async () => {
      mockRequest.mockResolvedValue({
        items: [],
        next_cursor: null,
        has_more: false,
        limit: 20
      });

      const filters = { city: "Bangalore", budget_max: 30000 };
      renderHook(() => usePeers(filters), { wrapper: createWrapper() });

      await waitFor(() => expect(mockRequest).toHaveBeenCalled());
      const call = mockRequest.mock.calls[0][0];
      expect(call.path).toBe("/flatmates/profiles");
      expect(call.query).toEqual(filters);
    });
  });

  describe("useUpdateProfile", () => {
    it("invalidates ['profile', 'me'] on success", async () => {
      mockRequest.mockResolvedValue({ id: 101, full_name: "Updated" });

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } }
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      result.current.mutate({ full_name: "Updated" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["profile", "me"] });
    });
  });
});
