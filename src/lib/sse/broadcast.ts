import type { SSEEvent } from "./types";

// ──────────────────────────────────────────────
// BroadcastChannel multi-tab dedup
// Only the "primary" tab holds the SSE connection.
// Secondary tabs receive relayed events via BroadcastChannel.
// ──────────────────────────────────────────────

const CHANNEL_NAME = "360-flatmates-sse";
const CLAIM_PRIMARY = "claim_primary";
const PRIMARY_ALIVE = "primary_alive";
const RELAY_EVENT = "relay_event";
const RELINQUISH_PRIMARY = "relinquish_primary";
// If the main thread is blocked (heavy render, long task) for longer than
// this window, a CLAIM_PRIMARY message may go unanswered and two tabs could
// both consider themselves primary (dual-primary). In practice this is rare
// and self-healing: the next visibilitychange cycle re-negotiates.
const NEGOTIATION_TIMEOUT_MS = 1_000;

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
 * from the primary tab.
 */
export function onRelayedEvent(callback: (event: SSEEvent) => void): void {
  relayEventHandler = callback;
}

/**
 * Called when the primary tab is unloading or going hidden,
 * allowing secondary tabs to take over.
 */
export function relinquishPrimary(): void {
  if (!isPrimary) return;
  isPrimary = false;

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

  if (channel) {
    channel.close();
    channel = null;
  }

  relayEventHandler = null;
  isPrimary = false;
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
    case CLAIM_PRIMARY:
      // Another tab wants to be primary — if we are primary, assert alive
      if (isPrimary) {
        ensureChannel();
        channel!.postMessage({ type: PRIMARY_ALIVE } satisfies BroadcastPayload);
      }
      break;

    case RELINQUISH_PRIMARY:
      // Primary tab is giving up — secondary can try to take over
      if (!isPrimary && !document.hidden) {
        becomePrimaryTab().then((won) => {
          if (won) {
            dispatchPrimaryChanged(true);
          }
        });
      }
      break;

    case RELAY_EVENT:
      // Primary relayed an SSE event to us
      if (relayEventHandler && !isPrimary) {
        relayEventHandler(payload.event);
      }
      break;
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
