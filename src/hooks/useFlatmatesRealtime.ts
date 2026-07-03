import { useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { FlatmatesRealtimeConfig } from "@/lib/api/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uiStore } from "@/lib/stores/ui-store";

export const FLATMATES_REALTIME_EVENTS = [
  "new_match",
  "new_message",
  "conversation_updated",
  "visit_updated",
  "listing_status_changed",
  "new_notification",
] as const;

type FlatmatesRealtimeEvent = (typeof FLATMATES_REALTIME_EVENTS)[number];

interface UseFlatmatesRealtimeOptions {
  enabled: boolean;
  accessToken: string | null;
  realtime: FlatmatesRealtimeConfig | null | undefined;
}

const channelRemovalPromises = new Map<string, Promise<void>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPositiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function normalizeBroadcastData(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) return {};
  const inner = isRecord(payload.payload) ? payload.payload : payload;
  return isRecord(inner.data) ? inner.data : inner;
}

function configuredEvents(events: readonly string[] | undefined): FlatmatesRealtimeEvent[] {
  const allowed = new Set<string>(FLATMATES_REALTIME_EVENTS);
  const filtered = (events ?? []).filter((event): event is FlatmatesRealtimeEvent =>
    allowed.has(event)
  );
  return filtered.length > 0 ? filtered : [...FLATMATES_REALTIME_EVENTS];
}

function trackChannelRemoval(channelName: string, removal: Promise<unknown> | unknown) {
  const promise = Promise.resolve(removal)
    .catch(() => undefined)
    .then(() => undefined)
    .finally(() => {
      if (channelRemovalPromises.get(channelName) === promise) {
        channelRemovalPromises.delete(channelName);
      }
    });
  channelRemovalPromises.set(channelName, promise);
  return promise;
}

export function useFlatmatesRealtime({
  enabled,
  accessToken,
  realtime,
}: UseFlatmatesRealtimeOptions): void {
  const queryClient = useQueryClient();
  const events = useMemo(() => configuredEvents(realtime?.events), [realtime?.events]);
  const eventKey = events.join("|");

  useEffect(() => {
    if (!enabled || !accessToken || !realtime?.channel) {
      uiStore.getState().setRealtimeState("disconnected");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const channelName = realtime.channel;
    const privateChannel = realtime.private ?? true;
    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelayMs = 1_000;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectingAfterOutage = false;

    function clearReconnectTimer() {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function removeCurrentChannel() {
      if (!channel) return channelRemovalPromises.get(channelName) ?? Promise.resolve();
      const current = channel;
      channel = null;
      return trackChannelRemoval(channelName, supabase.removeChannel(current));
    }

    function invalidateAfterOutage() {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["visits"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["search", "web"] });
      queryClient.invalidateQueries({ queryKey: ["map"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["incoming-likes"] });
      queryClient.invalidateQueries({ queryKey: ["outgoing-likes"] });
      queryClient.invalidateQueries({ queryKey: ["swipes", "deck"] });
    }

    function scheduleReconnect() {
      if (cancelled || reconnectTimer !== null) return;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void connect();
      }, reconnectDelayMs);
      reconnectDelayMs = Math.min(reconnectDelayMs * 2, 30_000);
    }

    function invalidateForEvent(event: FlatmatesRealtimeEvent, data: Record<string, unknown>) {
      switch (event) {
        case "new_notification":
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          uiStore.getState().pushToast({
            type: "info",
            title: toOptionalString(data.title) ?? "New notification",
            description: toOptionalString(data.body),
          });
          break;

        case "new_message": {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          const conversationId = toPositiveNumber(data.conversation_id);
          if (conversationId !== null) {
            queryClient.invalidateQueries({ queryKey: ["conversations", conversationId] });
            queryClient.invalidateQueries({
              queryKey: ["conversations", conversationId, "messages"],
            });
          }
          break;
        }

        case "conversation_updated": {
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          const conversationId = toPositiveNumber(data.conversation_id);
          if (conversationId !== null) {
            queryClient.invalidateQueries({ queryKey: ["conversations", conversationId] });
            queryClient.invalidateQueries({
              queryKey: ["conversations", conversationId, "messages"],
            });
          }
          break;
        }

        case "visit_updated": {
          queryClient.invalidateQueries({ queryKey: ["visits"] });
          const visitId = toPositiveNumber(data.visit_id);
          if (visitId !== null) {
            queryClient.invalidateQueries({ queryKey: ["visits", visitId] });
          }
          break;
        }

        case "listing_status_changed": {
          queryClient.invalidateQueries({ queryKey: ["properties"] });
          queryClient.invalidateQueries({ queryKey: ["search", "web"] });
          queryClient.invalidateQueries({ queryKey: ["map"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          const propertyId = toPositiveNumber(data.property_id);
          if (propertyId !== null) {
            queryClient.invalidateQueries({ queryKey: ["properties", propertyId] });
            queryClient.invalidateQueries({ queryKey: ["properties", propertyId, "mine"] });
          }
          break;
        }

        case "new_match":
          queryClient.invalidateQueries({ queryKey: ["swipes", "deck"] });
          queryClient.invalidateQueries({ queryKey: ["matches"] });
          queryClient.invalidateQueries({ queryKey: ["incoming-likes"] });
          queryClient.invalidateQueries({ queryKey: ["outgoing-likes"] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          uiStore.getState().pushToast({
            type: "success",
            title: "New match",
            description: "You have a new flatmate match.",
          });
          break;
      }
    }

    async function connect() {
      if (cancelled) return;
      await removeCurrentChannel();
      await (channelRemovalPromises.get(channelName) ?? Promise.resolve());
      if (cancelled) return;
      uiStore.getState().setRealtimeState(
        reconnectDelayMs > 1_000 ? "reconnecting" : "connecting"
      );

      try {
        await supabase.realtime.setAuth(accessToken);
      } catch {
        if (!cancelled) {
          uiStore.getState().setRealtimeState("error");
          scheduleReconnect();
        }
        return;
      }

      if (cancelled) return;

      const nextChannel = supabase.channel(channelName, {
        config: { private: privateChannel },
      });
      channel = nextChannel;

      for (const event of events) {
        nextChannel.on("broadcast", { event }, (payload) => {
          invalidateForEvent(event, normalizeBroadcastData(payload));
        });
      }

      nextChannel.subscribe((status) => {
        if (cancelled || channel !== nextChannel) return;

        if (status === "SUBSCRIBED") {
          reconnectDelayMs = 1_000;
          uiStore.getState().setRealtimeState("connected");
          if (reconnectingAfterOutage) {
            reconnectingAfterOutage = false;
            invalidateAfterOutage();
          }
          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          reconnectingAfterOutage = true;
          uiStore.getState().setRealtimeState("reconnecting");
          void removeCurrentChannel();
          scheduleReconnect();
        }
      });
    }

    void connect();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      void removeCurrentChannel();
      uiStore.getState().setRealtimeState("disconnected");
    };
  }, [
    accessToken,
    enabled,
    eventKey,
    events,
    queryClient,
    realtime?.channel,
    realtime?.private,
  ]);
}
