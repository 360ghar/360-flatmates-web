export * from "./client";
export * from "./errors";
export * from "./types";

import { createApiClient } from "./client";
import type { ApiAdapter } from "./client";
import { authStore } from "@/lib/stores/auth-store";

/* The session in authStore is the source of truth for the bearer token, so
   requests never run with a token that lags the session (W8). `_accessToken`
   only holds a token from an explicit refresh until the store catches up. */
let _accessToken: string | null = null;
authStore.subscribe((state, prev) => {
  if (state.session !== prev.session) _accessToken = null;
});

function currentAccessToken(): string | null {
  return _accessToken ?? authStore.getState().session?.access_token ?? null;
}

let _refreshHandler: (() => Promise<string | null>) | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function setRefreshTokenHandler(
  handler: (() => Promise<string | null>) | null
): void {
  _refreshHandler = handler;
}

async function handleRefresh(): Promise<string | null> {
  if (!_refreshHandler) return null;
  // NOTE (F10 #5): there is a benign race window between the consumer calling
  // `setRefreshTokenHandler` and the first 401. If a 401 fires before the
  // handler is wired up (e.g. concurrent mount), the client falls back to a
  // failed refresh and propagates the 401. The `Providers` mount sequence
  // registers the handler synchronously inside a `useEffect`, so in the
  // normal cold-load path the handler is set before any user-driven call
  // could trigger a 401. The dedupe (`inflight` in lib/auth/refresh.ts and
  // `refreshing` on HttpApiClient) is correct in steady state. Flag for
  // follow-up if this ever becomes user-visible.
  const newToken = await _refreshHandler();
  if (newToken) _accessToken = newToken;
  return newToken;
}

export const apiClient: ApiAdapter = createApiClient({
  getAccessToken: currentAccessToken,
  onAuthFailure: handleRefresh,
});
