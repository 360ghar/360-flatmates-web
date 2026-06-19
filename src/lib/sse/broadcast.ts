import type { SSEEvent } from "./types";

// ──────────────────────────────────────────────
// BroadcastChannel multi-tab dedup
//
// PROTOCOL
// ────────
// Only one tab holds the live SSE connection ("primary"). All other tabs
// ("secondaries") receive events via the BroadcastChannel `360-flatmates-sse`.
// Channel messages are typed via a discriminated union; consumers should
// switch on `payload.type`.
//
// Message types:
//   claim_primary     — broadcast by a tab that wants to take over primary.
//                       A live primary responds with `primary_alive`.
//   primary_alive     — periodic heartbeat from the primary (~10s) AND the
//                       one-shot reply to a `claim_primary`. Secondaries
//                       track the timestamp; if they miss 2–3 heartbeats
//                       (~20–30s of silence), they attempt to take over.
//   relay_event       — primary → all secondaries. Carries the full SSE
//                       event payload so secondaries can reapply the same
//                       TanStack Query invalidations.
//   relinquish_primary — primary's goodbye, used on tab close / hide so a
//                       secondary can win the next `claim_primary` race
//                       without waiting for the heartbeat timeout.
//
// ELECTION RACE
// ────────────
//   1. New tab broadcasts `claim_primary`, starts a 1s timer.
//   2. Existing primary (if any) replies `primary_alive` immediately.
//   3. If a `primary_alive` arrives, the new tab stays secondary.
//   4. If the 1s timer fires with no `primary_alive`, the new tab becomes
//      primary and starts its own heartbeat loop.
//   5. On visibility change: primary hidden → relinquish; secondary
//      becoming visible → re-attempt election.
//
// FAILURE MODES
// ─────────────
//   * Primary tab crashes (no `relinquish_primary`): secondaries detect the
//     missed heartbeat and re-elect within ~20–30s.
//   * Main-thread starvation prevents `claim_primary` reply: rare; the
//     negotiation timeout (1s) self-heals on the next visibility cycle.
// ──────────────────────────────────────────────

const CHANNEL_NAME = "360-flatmates-sse";
const CLAIM_PRIMARY = "claim_primary";
const PRIMARY_ALIVE = "primary_alive";
const RELAY_EVENT = "relay_event";
const RELINQUISH_PRIMARY = "relinquish_primary";

const NEGOTIATION_TIMEOUT_MS = 1_000;
const PRIMARY_HEARTBEAT_INTERVAL_MS = 10_000;
// Missed heartbeats before a secondary attempts to take over. 3 * 10s = 30s
// of silence is the threshold; one missed ping is forgiven in case of
// transient tab-throttling.
const PRIMARY_HEARTBEAT_GRACE_MISSES = 3;

type BroadcastPayload =
  | { type: typeof CLAIM_PRIMARY }
  | { type: typeof PRIMARY_ALIVE }
  | { type: typeof RELAY_EVENT; event: SSEEvent }
  | { type: typeof RELINQUISH_PRIMARY };

let channel: BroadcastChannel | null = null;
let isPrimary = false;
let negotiationTimer: ReturnType<typeof setTimeout> | null = null;
let primaryAliveHandler: ((event: MessageEvent) => void) | null = null;
let relayEventHandler: ((event: SSEEvent) => void) | null = null;
let visibilityHandler: (() => void) | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let livenessCheckTimer: ReturnType<typeof setInterval> | null = null;
let lastPrimaryAliveAt = 0;
let hasSeenPrimary = false;

// ── Public API ─────────────────────────────

/**
 * Attempt to become the primary SSE tab.
 * Returns a promise that resolves to `true` if this tab wins
 * the primary role, or `false` if another tab is already primary.
 */
export function becomePrimaryTab(): Promise<boolean> {
  ensureChannel();

  return new Promise<boolean>((resolve) => {
    // Set up a one-shot listener for "primary_alive" responses
    primaryAliveHandler = (event: MessageEvent) => {
      const payload = event.data as BroadcastPayload;
      if (payload.type === PRIMARY_ALIVE) {
        cleanupNegotiation();
        isPrimary = false;
        hasSeenPrimary = true;
        lastPrimaryAliveAt = Date.now();
        resolve(false);
      }
    };

    channel!.addEventListener("message", primaryAliveHandler);

    // Broadcast claim and wait for responses
    channel!.postMessage({ type: CLAIM_PRIMARY } satisfies BroadcastPayload);

    negotiationTimer = setTimeout(() => {
      // No existing primary responded — this tab becomes primary
      cleanupNegotiation();
      isPrimary = true;
      hasSeenPrimary = true;
      lastPrimaryAliveAt = Date.now();
      startHeartbeat();
      startLivenessCheck();
      resolve(true);
    }, NEGOTIATION_TIMEOUT_MS);
  });
}

/**
 * Primary tab broadcasts an SSE event to all secondary tabs.
 */
export function relayEvent(event: SSEEvent): void {
  if (!isPrimary) return;
  ensureChannel();
  channel!.postMessage({
    type: RELAY_EVENT,
    event,
  } satisfies BroadcastPayload);
}

/**
 * Secondary tabs register a callback to receive relayed events
 * from the primary tab. Pass the result of `offRelayedEvent` (or no
 * argument) to the cleanup returned by `useEffect` to avoid leaking
 * the handler between mount cycles.
 */
export function onRelayedEvent(callback: (event: SSEEvent) => void): void {
  relayEventHandler = callback;
}

/**
 * Drop the relay-event handler. Safe to call when no handler is registered.
 */
export function offRelayedEvent(): void {
  relayEventHandler = null;
}

/**
 * Called when the primary tab is unloading or going hidden,
 * allowing secondary tabs to take over.
 */
export function relinquishPrimary(): void {
  if (!isPrimary) return;
  isPrimary = false;
  stopHeartbeat();
  stopLivenessCheck();

  if (channel) {
    channel.postMessage({
      type: RELINQUISH_PRIMARY,
    } satisfies BroadcastPayload);
  }
}

/**
 * Set up visibilitychange listener so that when the primary tab
 * goes hidden, a secondary tab can negotiate to take over.
 */
export function setupVisibilityNegotiation(): void {
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
  }

  visibilityHandler = () => {
    if (document.hidden && isPrimary) {
      relinquishPrimary();
    } else if (!document.hidden && !isPrimary) {
      becomePrimaryTab().then((won) => {
        if (won) {
          dispatchPrimaryChanged(true);
        }
      });
    }
  };

  document.addEventListener("visibilitychange", visibilityHandler);
  startLivenessCheck();
}

/**
 * Clean up the BroadcastChannel and all listeners.
 */
export function close(): void {
  if (visibilityHandler) {
    document.removeEventListener("visibilitychange", visibilityHandler);
    visibilityHandler = null;
  }

  relinquishPrimary();
  cleanupNegotiation();
  stopLivenessCheck();

  if (channel) {
    channel.close();
    channel = null;
  }

  relayEventHandler = null;
  isPrimary = false;
  hasSeenPrimary = false;
  lastPrimaryAliveAt = 0;
}

/** Returns whether this tab currently considers itself primary. */
export function getIsPrimaryTab(): boolean {
  return isPrimary;
}

// ── Primary-changed callback ───────────────

let primaryChangedCallback: ((isPrimary: boolean) => void) | null = null;

export function onPrimaryChanged(
  callback: (isPrimary: boolean) => void,
): void {
  primaryChangedCallback = callback;
}

function dispatchPrimaryChanged(isNowPrimary: boolean): void {
  primaryChangedCallback?.(isNowPrimary);
}

// ── Internal helpers ───────────────────────

function ensureChannel(): void {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", handleIncomingMessage);
  }
}

function handleIncomingMessage(event: MessageEvent): void {
  const payload = event.data as BroadcastPayload;

  switch (payload.type) {
    case CLAIM_PRIMARY: {
      // Another tab wants to be primary — if we are primary, assert alive
      if (isPrimary) {
        ensureChannel();
        channel!.postMessage({ type: PRIMARY_ALIVE } satisfies BroadcastPayload);
      }
      break;
    }

    case PRIMARY_ALIVE: {
      // Heartbeat (periodic) or response to our own claim.
      hasSeenPrimary = true;
      lastPrimaryAliveAt = Date.now();
      break;
    }

    case RELINQUISH_PRIMARY: {
      // Primary tab is giving up — secondary can try to take over
      if (!isPrimary && !document.hidden) {
        becomePrimaryTab().then((won) => {
          if (won) {
            dispatchPrimaryChanged(true);
          }
        });
      }
      break;
    }

    case RELAY_EVENT: {
      // Primary relayed an SSE event to us
      if (relayEventHandler && !isPrimary) {
        relayEventHandler(payload.event);
      }
      break;
    }
  }
}

function cleanupNegotiation(): void {
  if (negotiationTimer !== null) {
    clearTimeout(negotiationTimer);
    negotiationTimer = null;
  }

  if (primaryAliveHandler && channel) {
    channel.removeEventListener("message", primaryAliveHandler);
    primaryAliveHandler = null;
  }
}

function startHeartbeat(): void {
  if (heartbeatTimer !== null) return;
  heartbeatTimer = setInterval(() => {
    if (!isPrimary) {
      stopHeartbeat();
      return;
    }
    if (!channel) return;
    channel.postMessage({
      type: PRIMARY_ALIVE
    } satisfies BroadcastPayload);
  }, PRIMARY_HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat(): void {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startLivenessCheck(): void {
  if (livenessCheckTimer !== null) return;
  // Check twice per heartbeat interval so we notice a missed ping quickly.
  livenessCheckTimer = setInterval(() => {
    if (isPrimary) return;
    if (!hasSeenPrimary) return;
    if (document.hidden) return;
    const silenceMs = Date.now() - lastPrimaryAliveAt;
    const thresholdMs =
      PRIMARY_HEARTBEAT_INTERVAL_MS * PRIMARY_HEARTBEAT_GRACE_MISSES;
    if (silenceMs >= thresholdMs) {
      // Primary looks dead — re-elect.
      hasSeenPrimary = false;
      becomePrimaryTab().then((won) => {
        if (won) {
          dispatchPrimaryChanged(true);
        }
      });
    }
  }, PRIMARY_HEARTBEAT_INTERVAL_MS / 2);
}

function stopLivenessCheck(): void {
  if (livenessCheckTimer !== null) {
    clearInterval(livenessCheckTimer);
    livenessCheckTimer = null;
  }
}
