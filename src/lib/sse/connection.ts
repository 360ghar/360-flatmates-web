import {
  type SSEEvent,
  type SSEEventType,
  SSEConnectionState,
} from "./types";

// ──────────────────────────────────────────────
// SSE Connection Manager
// Pure TypeScript class — no React dependency
// ──────────────────────────────────────────────

const SSE_EVENT_TYPES: SSEEventType[] = [
  "notification",
  "message",
  "visit_update",
  "swipe",
  "property_update",
  "profile_update",
  "system",
  "ping",
  "new_match",
  "new_message",
  "conversation_updated",
  "listing_status_changed",
];

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
const HEARTBEAT_TIMEOUT_MS = 60_000;

export interface SSEConnectionManagerOptions {
  url: string;
  getToken: () => Promise<string | null>;
  onAuthFailure?: () => Promise<string | null>;
  onEvent: (event: SSEEvent) => void;
  onStateChange: (state: SSEConnectionState) => void;
}

const AUTH_FAILURE_MAX = 3;

export class SSEConnectionManager {
  private readonly url: string;
  private readonly getToken: () => Promise<string | null>;
  private readonly onAuthFailure?: () => Promise<string | null>;
  private readonly onEvent: (event: SSEEvent) => void;
  private readonly onStateChange: (state: SSEConnectionState) => void;

  private eventSource: EventSource | null = null;
  private state: SSEConnectionState = SSEConnectionState.Disconnected;
  private backoffMs = INITIAL_BACKOFF_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private consecutiveFailures = 0;
  private opened = false;

  constructor(options: SSEConnectionManagerOptions) {
    this.url = options.url;
    this.getToken = options.getToken;
    this.onAuthFailure = options.onAuthFailure;
    this.onEvent = options.onEvent;
    this.onStateChange = options.onStateChange;
  }

  // ── Public API ────────────────────────────

  async connect(): Promise<void> {
    if (this.state === SSEConnectionState.Connected || this.eventSource) {
      return;
    }

    this.disposed = false;
    this.opened = false;
    this.setState(SSEConnectionState.Connecting);

    const token = await this.getToken();
    if (!token) {
      this.setState(SSEConnectionState.Disconnected);
      return;
    }

    // SECURITY NOTE: The EventSource API does not support custom headers,
    // so the auth token is passed as a URL query parameter. This is a known
    // limitation of the browser EventSource specification. Mitigations:
    //  - Token is short-lived (Supabase JWT with refresh rotation)
    //  - Token is URL-encoded to prevent injection
    //  - Server should not log the full query string in production
    //  - Referrer-Policy: no-referrer prevents token leakage via Referer
    // Alternative: Use fetch() + ReadableStream for SSE with Authorization
    // header, which avoids this risk but requires a custom SSE parser.
    const url = `${this.url}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    this.eventSource = es;

    es.addEventListener("open", this.handleOpen);
    es.addEventListener("error", this.handleError);

    for (const eventType of SSE_EVENT_TYPES) {
      es.addEventListener(eventType, this.handleMessage);
    }
  }

  disconnect(): void {
    this.disposed = true;
    this.cleanup();
    this.setState(SSEConnectionState.Disconnected);
  }

  getConnectionState(): SSEConnectionState {
    return this.state;
  }

  // ── Private helpers ───────────────────────

  private setState(state: SSEConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.onStateChange(state);
  }

  private handleOpen = (): void => {
    this.backoffMs = INITIAL_BACKOFF_MS;
    this.opened = true;
    this.consecutiveFailures = 0;
    this.setState(SSEConnectionState.Connected);
    this.resetHeartbeat();
  };

  private handleError = (): void => {
    const wasAuthFailure = !this.opened;
    this.cleanup();

    if (this.disposed) return;

    if (wasAuthFailure) {
      this.consecutiveFailures++;
    } else {
      this.consecutiveFailures = 0;
    }

    if (this.consecutiveFailures >= AUTH_FAILURE_MAX && this.onAuthFailure) {
      this.onAuthFailure()
        .then(() => {
          this.consecutiveFailures = 0;
          this.setState(SSEConnectionState.Reconnecting);
          this.scheduleReconnect();
        })
        .catch(() => {
          this.setState(SSEConnectionState.Reconnecting);
          this.scheduleReconnect();
        });
      return;
    }

    this.setState(SSEConnectionState.Reconnecting);
    this.scheduleReconnect();
  };

  private handleMessage = (event: MessageEvent): void => {
    this.resetHeartbeat();

    try {
      const parsed = JSON.parse(event.data as string) as unknown;

      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "type" in parsed &&
        "data" in parsed
      ) {
        const sseEvent = parsed as SSEEvent;
        this.onEvent(sseEvent);
      }
    } catch {
      // Malformed payload — ignore silently
    }
  };

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.backoffMs);

    // Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (max)
    this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
  }

  private resetHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearTimeout(this.heartbeatTimer);
    }

    this.heartbeatTimer = setTimeout(() => {
      // No event received within the heartbeat window — reconnect
      if (
        this.state === SSEConnectionState.Connected &&
        !this.disposed
      ) {
        this.cleanup();
        this.setState(SSEConnectionState.Reconnecting);
        this.scheduleReconnect();
      }
    }, HEARTBEAT_TIMEOUT_MS);
  }

  private cleanup(): void {
    if (this.eventSource !== null) {
      this.eventSource.removeEventListener("open", this.handleOpen);
      this.eventSource.removeEventListener("error", this.handleError);

      for (const eventType of SSE_EVENT_TYPES) {
        this.eventSource.removeEventListener(eventType, this.handleMessage);
      }

      this.eventSource.close();
      this.eventSource = null;
    }

    this.opened = false;

    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.heartbeatTimer !== null) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// ── Singleton ───────────────────────────────

let managerInstance: SSEConnectionManager | null = null;

export function getSSEManager(
  options?: SSEConnectionManagerOptions,
): SSEConnectionManager | null {
  if (!managerInstance && options) {
    managerInstance = new SSEConnectionManager(options);
  }
  return managerInstance;
}

export function resetSSEManager(): void {
  if (managerInstance) {
    managerInstance.disconnect();
    managerInstance = null;
  }
}
