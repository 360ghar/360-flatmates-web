import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SSEConnectionState } from "@/lib/sse/types";

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
const mockGetConnectionState = vi.fn();

const mockManager = {
  connect: mockConnect,
  disconnect: mockDisconnect,
  getConnectionState: mockGetConnectionState
};

let sseManagerOptions: Record<string, unknown> | null = null;

vi.mock("@/lib/sse/connection", () => ({
  getSSEManager: (options: Record<string, unknown>) => {
    sseManagerOptions = options;
    return mockManager;
  },
  resetSSEManager: vi.fn()
}));

vi.mock("@/lib/sse/broadcast", () => ({
  becomePrimaryTab: vi.fn().mockResolvedValue(true),
  close: vi.fn(),
  getIsPrimaryTab: vi.fn().mockReturnValue(false),
  onPrimaryChanged: vi.fn(),
  onRelayedEvent: vi.fn(),
  relayEvent: vi.fn(),
  relinquishPrimary: vi.fn(),
  setupVisibilityNegotiation: vi.fn()
}));

vi.mock("@/lib/stores/ui-store", () => ({
  uiStore: {
    getState: () => ({
      sseConnected: false,
      sseState: "disconnected",
      setSseConnected: vi.fn(),
      setSSEState: vi.fn(),
      setSSEPrimaryTab: vi.fn()
    }),
    setState: vi.fn()
  }
}));

import { useSSE } from "@/hooks/useSSE";

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

describe("useSSE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sseManagerOptions = null;
  });

  it("starts in disconnected state", () => {
    const { result } = renderHook(
      () => useSSE(true, () => Promise.resolve("token")),
      { wrapper: createWrapper() }
    );
    expect(result.current.connectionState).toBe(SSEConnectionState.Disconnected);
  });

  it("does not connect when not authenticated", () => {
    const { result } = renderHook(
      () => useSSE(false, () => Promise.resolve("token")),
      { wrapper: createWrapper() }
    );
    expect(result.current.connectionState).toBe(SSEConnectionState.Disconnected);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("connects SSE manager when authenticated and becomes primary", async () => {
    const { result } = renderHook(
      () => useSSE(true, () => Promise.resolve("test-token")),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });

    expect(result.current.isPrimaryTab).toBe(true);
  });

  it("passes correct options to getSSEManager", async () => {
    renderHook(
      () => useSSE(true, () => Promise.resolve("test-token")),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(sseManagerOptions).not.toBeNull();
    });

    expect(sseManagerOptions).toHaveProperty("url");
    expect(sseManagerOptions).toHaveProperty("getToken");
    expect(sseManagerOptions).toHaveProperty("onEvent");
    expect(sseManagerOptions).toHaveProperty("onStateChange");
  });

  it("dispatches state change to connectionState", async () => {
    const getToken = () => Promise.resolve("token");
    const { result } = renderHook(
      () => useSSE(true, getToken),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(sseManagerOptions).not.toBeNull();
    });

    const onStateChange = sseManagerOptions!.onStateChange as (state: SSEConnectionState) => void;

    act(() => {
      onStateChange(SSEConnectionState.Connected);
    });

    await waitFor(() => {
      expect(result.current.connectionState).toBe(SSEConnectionState.Connected);
    });
  });

  it("invalidates queries on notification event", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    renderHook(
      () => useSSE(true, () => Promise.resolve("token")),
      { wrapper }
    );

    await waitFor(() => {
      expect(sseManagerOptions).not.toBeNull();
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onEvent = sseManagerOptions!.onEvent as (event: { type: string; data: Record<string, unknown> }) => void;

    act(() => {
      onEvent({ type: "notification", data: { id: "1", type: "new_match", title: "New match" } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });

  it("invalidates queries on message event", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    renderHook(
      () => useSSE(true, () => Promise.resolve("token")),
      { wrapper }
    );

    await waitFor(() => {
      expect(sseManagerOptions).not.toBeNull();
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onEvent = sseManagerOptions!.onEvent as (event: { type: string; data: Record<string, unknown> }) => void;

    act(() => {
      onEvent({
        type: "message",
        data: { conversation_id: 5, message_id: 100, sender_id: 202 }
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["conversations", 5, "messages"]
    });
  });

  it("invalidates queries on visit_update event", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    renderHook(
      () => useSSE(true, () => Promise.resolve("token")),
      { wrapper }
    );

    await waitFor(() => {
      expect(sseManagerOptions).not.toBeNull();
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onEvent = sseManagerOptions!.onEvent as (event: { type: string; data: Record<string, unknown> }) => void;

    act(() => {
      onEvent({
        type: "visit_update",
        data: { visit_id: 1, property_id: 301, status: "confirmed" }
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["visits"] });
  });

  it("invalidates queries on swipe event", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    renderHook(
      () => useSSE(true, () => Promise.resolve("token")),
      { wrapper }
    );

    await waitFor(() => {
      expect(sseManagerOptions).not.toBeNull();
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onEvent = sseManagerOptions!.onEvent as (event: { type: string; data: Record<string, unknown> }) => void;

    act(() => {
      onEvent({
        type: "swipe",
        data: { target_user_id: 202, action: "like", target_type: "profile" }
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["swipes", "deck"] });
  });

  it("invalidates queries on property_update event", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    renderHook(
      () => useSSE(true, () => Promise.resolve("token")),
      { wrapper }
    );

    await waitFor(() => {
      expect(sseManagerOptions).not.toBeNull();
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onEvent = sseManagerOptions!.onEvent as (event: { type: string; data: Record<string, unknown> }) => void;

    act(() => {
      onEvent({
        type: "property_update",
        data: { property_id: 301, change_type: "approved" }
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["properties"] });
  });

  it("does not invalidate queries on ping event", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    renderHook(
      () => useSSE(true, () => Promise.resolve("token")),
      { wrapper }
    );

    await waitFor(() => {
      expect(sseManagerOptions).not.toBeNull();
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const onEvent = sseManagerOptions!.onEvent as (event: { type: string; data: Record<string, unknown> }) => void;

    act(() => {
      onEvent({ type: "ping", data: { timestamp: 1000 } });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
