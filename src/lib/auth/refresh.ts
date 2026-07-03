import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { setAccessToken } from "@/lib/api";

// Routes where an unauthenticated user is expected. Recovering (sign-out +
// redirect to /login) on these would either loop or yank users off pages they
// are allowed to view anonymously, so we skip them.
const AUTH_PATH_PREFIXES = ["/login", "/signup", "/forgot-password", "/auth/"];

// Fire-once guard so a burst of failed refreshes only triggers one recovery.
let recovering = false;

// In-flight mutex: the single dedupe point for all callers. N concurrent
// callers share one refresh promise; this prevents racing refreshSession()
// calls that increase the chance of tripping Supabase refresh-token reuse
// detection.
let inflight: Promise<string | null> | null = null;

function isRecoverableAuthError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const code = String((err as { code?: unknown }).code ?? "");
  const message = String((err as { message?: unknown }).message ?? "");
  // Supabase surfaces dead-session failures with codes/messages mentioning
  // session, refresh token, jwt, or expiry. Network and 5xx errors do not
  // match, so transient failures leave the user in place to retry.
  return (
    /session|refresh|token|jwt|expired|invalid/i.test(code) ||
    /session|refresh|token|jwt|expired|invalid/i.test(message)
  );
}

/**
 * Sign out locally and route the user to /login with a redirect target.
 *
 * Called when the session is dead and unrecoverable: refresh-token reuse
 * detection revoked the session, an admin revoked it, or the inactivity
 * timeout reaped it. The backend session is already gone, so the local
 * signOut is best-effort and failures are swallowed.
 *
 * Exported (not just used internally) so tests can assert on the recovery
 * path without waiting for a real window.location.assign.
 */
export function recoverDeadSession(): void {
  if (recovering) return;
  const { pathname, search } = window.location;
  if (AUTH_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;
  recovering = true;
  // Best-effort local sign-out. The backend session is already dead and the
  // refresh token is unrecoverable, so failures here are expected and ignored.
  // The `isAuthenticated` false-edge effect in providers.tsx clears the
  // query cache once onAuthStateChange fires SIGNED_OUT.
  void getSupabaseBrowserClient()
    .auth.signOut()
    .catch(() => {});
  const redirect = encodeURIComponent(`${pathname}${search}`);
  window.location.assign(`/login?redirect=${redirect}`);
}

/**
 * The single source of truth for refreshing the access token.
 *
 * Dedupes concurrent callers onto one in-flight refreshSession() call, writes
 * the new token via the one authorized setter, and triggers recovery when the
 * session is dead.
 *
 * Returns the new access token on success, or `null` if the session could
 * not be refreshed (caller should treat the request as failed; recovery has
 * already been initiated if the failure is unrecoverable).
 *
 * @internal — consumed by providers.tsx as the API client 401 handler.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      const newToken = data.session?.access_token ?? null;
      if (newToken) {
        setAccessToken(newToken);
      } else {
        // refresh resolved but produced no session: the session is gone
        // (e.g. backend returned 401 on the next call, or reuse detection
        // already revoked it). Recover by signing out and routing to /login.
        recoverDeadSession();
      }
      return newToken;
    } catch (err) {
      // Recover only when the failure indicates a dead session. Transient
      // errors (network, 5xx) leave the user in place so the next
      // interaction can retry the refresh.
      if (isRecoverableAuthError(err)) {
        recoverDeadSession();
      }
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Test-only: reset the module's internal mutex and recovery guard so each
 * test starts from a clean state. Not for production use.
 */
export function _resetRefreshForTests(): void {
  inflight = null;
  recovering = false;
}
