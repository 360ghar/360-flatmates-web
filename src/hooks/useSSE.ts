import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSSEManager, resetSSEManager } from "@/lib/sse/connection";
import {
  type SSEEvent,
  SSEConnectionState,
} from "@/lib/sse/types";
import {
  becomePrimaryTab,
  close as closeBroadcast,
  getIsPrimaryTab,
  onPrimaryChanged,
  onRelayedEvent,
  relayEvent,
  relinquishPrimary,
  setupVisibilityNegotiation,
} from "@/lib/sse/broadcast";
import { setAccessToken } from "@/lib/api";
import { getEnv } from "@/lib/env";
import { uiStore } from "@/lib/stores/ui-store";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const SSE_URL = `${getEnv().VITE_API_BASE_URL}/flatmates/sse`;

const NOOP_RELAY = (): void => {};

interface UseSSEReturn {
  connectionState: SSEConnectionState;
  isPrimaryTab: boolean;
}

/**
 * React hook that connects to the SSE endpoint when the user is
 * authenticated, handles multi-tab dedup via BroadcastChannel,
 * and invalidates relevant TanStack Query keys on each event.
 */
export function useSSE(
  isAuthenticated: boolean,
  getToken: () => Promise<string | null>,
): UseSSEReturn {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<SSEConnectionState>(
    SSEConnectionState.Disconnected,
  );
  const [isPrimaryTab, setIsPrimaryTab] = useState(false);
  const mountedRef = useRef(false);

  const invalidateForEvent = useCallback(
    (event: SSEEvent) => {
      switch (event.type) {
        case "notification":
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          break;

        case "message":
        case "new_message":
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          if (event.data.conversation_id) {
            queryClient.invalidateQueries({
              queryKey: [
                "conversations",
                event.data.conversation_id,
                "messages",
              ],
            });
          }
          break;

        case "visit_update":
          queryClient.invalidateQueries({ queryKey: ["visits"] });
          break;

        case "swipe":
          queryClient.invalidateQueries({ queryKey: ["swipes", "deck"] });
          break;

        case "property_update":
        case "listing_status_changed":
          queryClient.invalidateQueries({ queryKey: ["properties"] });
          break;

        case "profile_update":
          queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
          break;

        case "system":
          queryClient.invalidateQueries({ queryKey: ["bootstrap"] });
          break;

        case "ping":
          // Ping is a keep-alive; no query invalidation needed
          break;

        case "new_match":
          queryClient.invalidateQueries({ queryKey: ["swipes", "deck"] });
          queryClient.invalidateQueries({ queryKey: ["matches"] });
          break;

        case "conversation_updated":
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          break;
      }
    },
    [queryClient],
  );

  const handleEvent = useCallback(
    (event: SSEEvent) => {
      uiStore.getState().setSseConnected(true);
      relayEvent(event);
      invalidateForEvent(event);
    },
    [invalidateForEvent],
  );

  const handleAuthFailure = useCallback(async (): Promise<string | null> => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) return null;
      setAccessToken(data.session.access_token);
      return data.session.access_token;
    } catch {
      return null;
    }
  }, []);

  const handleStateChange = useCallback(
    (state: SSEConnectionState) => {
      const isConnected = state === SSEConnectionState.Connected;
      const current = uiStore.getState();
      if (current.sseConnected !== isConnected || current.sseState !== state) {
        uiStore.setState({ sseConnected: isConnected, sseState: state });
      }
      setConnectionState(state);
    },
    [],
  );

  // NOTE (F6 #18): `getSSEManager` is a module-level singleton; if
  // `sseManagerOptions` changes identity, the next call below constructs a
  // *new* `SSEConnectionManager` and the old one is replaced. The provider
  // refactor (owned by F10) is expected to stabilise the identity of these
  // options — until then, a callback identity change mid-session will reset
  // the underlying EventSource. Documenting here because the race is
  // otherwise invisible from this file.
  const sseManagerOptions = useMemo(
    () => ({
      url: SSE_URL,
      getToken,
      onAuthFailure: handleAuthFailure,
      onEvent: handleEvent,
      onStateChange: handleStateChange,
    }),
    [getToken, handleAuthFailure, handleEvent, handleStateChange],
  );

  useEffect(() => {
    // Audit F6 #19: register the relay handler and reset it to a no-op on
    // unmount so the module-level `relayEventHandler` doesn't leak across
    // mounts. (A more thorough dedupe is owned by F10's cross-cutting SSE
    // refactor — `offRelayedEvent` is available in `broadcast.ts` for that
    // work.)
    onRelayedEvent((event: SSEEvent) => {
      invalidateForEvent(event);
    });
    return () => {
      onRelayedEvent(NOOP_RELAY);
    };
  }, [invalidateForEvent]);

  useEffect(() => {
    onPrimaryChanged((isPrimary: boolean) => {
      setIsPrimaryTab(isPrimary);
      uiStore.getState().setSSEPrimaryTab(isPrimary);

      if (isPrimary) {
        const manager = getSSEManager(sseManagerOptions);
        manager?.connect();
      }
    });
  }, [sseManagerOptions]);

  useEffect(() => {
    if (!isAuthenticated || mountedRef.current) return;
    mountedRef.current = true;

    let cancelled = false;

    async function setup() {
      const wonPrimary = await becomePrimaryTab();

      if (cancelled) return;

      setIsPrimaryTab(wonPrimary);
      uiStore.getState().setSSEPrimaryTab(wonPrimary);

      if (wonPrimary) {
        const manager = getSSEManager(sseManagerOptions);
        manager?.connect();
      }

      setupVisibilityNegotiation();
    }

    setup();

    return () => {
      cancelled = true;
      mountedRef.current = false;

      if (getIsPrimaryTab()) {
        relinquishPrimary();
        resetSSEManager();
      }

      closeBroadcast();

      setConnectionState(SSEConnectionState.Disconnected);
      uiStore.setState({
        sseConnected: false,
        sseState: SSEConnectionState.Disconnected,
        ssePrimaryTab: false,
      });
    };
  }, [isAuthenticated, sseManagerOptions]);

  return { connectionState, isPrimaryTab };
}
