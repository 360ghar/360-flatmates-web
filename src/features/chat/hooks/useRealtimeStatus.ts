import { useStore } from "zustand";
import { uiStore, type RealtimeState } from "@/lib/stores/ui-store";

interface RealtimeStatusReturn {
  state: RealtimeState;
  isConnected: boolean;
  reconnecting: boolean;
  hasIssue: boolean;
}

export function useRealtimeStatus(): RealtimeStatusReturn {
  const state = useStore(uiStore, (s) => s.realtimeState);

  return {
    state,
    isConnected: state === "connected",
    reconnecting: state === "reconnecting",
    hasIssue: state === "disconnected" || state === "reconnecting" || state === "error",
  };
}
