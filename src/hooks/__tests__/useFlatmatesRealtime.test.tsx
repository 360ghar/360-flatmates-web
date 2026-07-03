import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { uiStore } from "@/lib/stores/ui-store";

type BroadcastHandler = (payload: unknown) => void;
type SubscribeHandler = (status: string, error?: Error) => void;

const broadcastHandlers = new Map<string, BroadcastHandler>();
let subscribeHandler: SubscribeHandler | null = null;

const mockChannel = {
  on: vi.fn((kind: string, filter: { event?: string }, callback: BroadcastHandler) => {
    if (kind === "broadcast" && filter.event) {
      broadcastHandlers.set(filter.event, callback);
    }
    return mockChannel;
  }),
  subscribe: vi.fn((callback: SubscribeHandler) => {
    subscribeHandler = callback;
    return mockChannel;
  })
};

const mockSetAuth = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
const mockChannelFactory = vi.fn(() => mockChannel);
const mockRemoveChannel = vi.fn<() => Promise<unknown>>().mockResolvedValue("ok");

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    realtime: { setAuth: mockSetAuth },
    channel: mockChannelFactory,
    removeChannel: mockRemoveChannel
  })
}));

import { useFlatmatesRealtime } from "@/hooks/useFlatmatesRealtime";

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

const realtime = {
  provider: "supabase" as const,
  channel: "flatmates:user:1",
  private: true,
  events: [
    "new_match",
    "new_message",
    "conversation_updated",
    "visit_updated",
    "listing_status_changed",
    "new_notification",
  ],
};

describe("useFlatmatesRealtime", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    broadcastHandlers.clear();
    subscribeHandler = null;
    uiStore.getState().setRealtimeState("disconnected");
    uiStore.setState({ toasts: [] });
  });

  it("opens a private Supabase Broadcast channel with the session token", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          realtime,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith("access-token");
      expect(mockChannelFactory).toHaveBeenCalledWith("flatmates:user:1", {
        config: { private: true },
      });
    });

    expect([...broadcastHandlers.keys()]).toEqual(realtime.events);
  });

  it("updates generic realtime status from subscribe lifecycle events", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          realtime,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(subscribeHandler).not.toBeNull());

    act(() => {
      subscribeHandler?.("SUBSCRIBED");
    });
    expect(uiStore.getState().realtimeState).toBe("connected");
    expect(uiStore.getState().realtimeConnected).toBe(true);

    act(() => {
      subscribeHandler?.("CHANNEL_ERROR");
    });
    expect(uiStore.getState().realtimeState).toBe("reconnecting");
    expect(uiStore.getState().realtimeConnected).toBe(false);
  });

  it("invalidates chat queries for new_message broadcasts", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          realtime,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(broadcastHandlers.has("new_message")).toBe(true));

    act(() => {
      broadcastHandlers.get("new_message")?.({
        payload: {
          type: "new_message",
          data: { conversation_id: 42, message_id: 7 },
        },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations", 42] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["conversations", 42, "messages"],
    });
  });

  it("invalidates domain queries for each backend broadcast event", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          realtime,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(broadcastHandlers.size).toBe(realtime.events.length));

    act(() => {
      broadcastHandlers.get("new_notification")?.({ payload: { data: { id: "n1" } } });
      broadcastHandlers.get("conversation_updated")?.({ payload: { data: { conversation_id: 42 } } });
      broadcastHandlers.get("visit_updated")?.({ payload: { data: { visit_id: 5 } } });
      broadcastHandlers.get("listing_status_changed")?.({ payload: { data: { property_id: 9 } } });
      broadcastHandlers.get("new_match")?.({ payload: { data: { match_id: 3 } } });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notifications"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations", 42] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["visits"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["visits", 5] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["properties"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["properties", 9] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["properties", 9, "mine"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["matches"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["incoming-likes"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["outgoing-likes"] });
    expect(uiStore.getState().toasts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "info", title: "New notification" }),
        expect.objectContaining({ type: "success", title: "New match" }),
      ])
    );
  });

  it("invalidates message cache for conversation_updated broadcasts", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          realtime,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(broadcastHandlers.has("conversation_updated")).toBe(true));

    act(() => {
      broadcastHandlers.get("conversation_updated")?.({
        payload: { data: { conversation_id: 42 } },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations", 42] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["conversations", 42, "messages"],
    });
  });

  it("catches up broad query namespaces after reconnecting", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          realtime,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(subscribeHandler).not.toBeNull());

    vi.useFakeTimers();
    act(() => {
      subscribeHandler?.("SUBSCRIBED");
      subscribeHandler?.("CHANNEL_ERROR");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(mockSetAuth).toHaveBeenCalledTimes(2);

    act(() => {
      subscribeHandler?.("SUBSCRIBED");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["conversations"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notifications"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["visits"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["properties"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["search", "web"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["map"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["matches"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["incoming-likes"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["outgoing-likes"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["swipes", "deck"] });
  });

  it("removes the channel on cleanup", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          realtime,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(mockChannelFactory).toHaveBeenCalled());

    unmount();

    await waitFor(() => {
      expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
    });
    expect(uiStore.getState().realtimeState).toBe("disconnected");
  });

  it("subscribes to all events when the config omits the events list", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          // The static type requires `events`, but the backend can omit it at
          // runtime; the hook must default to "all" rather than crash.
          realtime: {
            provider: "supabase",
            channel: "flatmates:user:1",
            private: true,
          } as unknown as typeof realtime,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(subscribeHandler).not.toBeNull());
    expect([...broadcastHandlers.keys()]).toEqual(realtime.events);
  });

  it("honors an explicit empty events array instead of widening to all", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    renderHook(
      () =>
        useFlatmatesRealtime({
          enabled: true,
          accessToken: "access-token",
          realtime: {
            provider: "supabase",
            channel: "flatmates:user:1",
            private: true,
            events: [],
          },
        }),
      { wrapper: createWrapper(queryClient) }
    );

    // The channel still opens and subscribes…
    await waitFor(() => expect(subscribeHandler).not.toBeNull());
    // …but no broadcast handlers are registered (explicit opt-out, not "all").
    expect(broadcastHandlers.size).toBe(0);
  });
});
