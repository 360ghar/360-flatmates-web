import { useStore } from "zustand";
import { uiStore } from "@/lib/stores/ui-store";

export const REALTIME_FALLBACK_POLL_MS = 15_000;

/** Poll interval for realtime-driven queries: off while the channel is
 *  connected, 15 s otherwise, so chats and notifications still update. */
export function useRealtimeFallbackInterval(): number | false {
  const connected = useStore(uiStore, (s) => s.realtimeState === "connected");
  return connected ? false : REALTIME_FALLBACK_POLL_MS;
}
