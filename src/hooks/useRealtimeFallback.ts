import { useStore } from "zustand";
import { uiStore } from "@/lib/stores/ui-store";

export const REALTIME_FALLBACK_POLL_MS = 15_000;

/** Poll interval for realtime-driven queries: off while the channel is
 *  connected AND subscribed to `event` (any event when omitted), 15 s
 *  otherwise, so chats and notifications still update. */
export function useRealtimeFallbackInterval(event?: string): number | false {
  const covered = useStore(
    uiStore,
    (s) => s.realtimeState === "connected" && (event === undefined || s.realtimeEvents.includes(event))
  );
  return covered ? false : REALTIME_FALLBACK_POLL_MS;
}
