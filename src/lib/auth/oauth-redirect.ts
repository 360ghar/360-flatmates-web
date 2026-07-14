import { resolveRedirect } from "@/lib/redirect";

/**
 * OAuth redirect URL construction + post-auth destination stash.
 *
 * Supabase only honors `redirectTo` values that match the project's
 * Authentication → URL Configuration allowlist. If the URL is not allowlisted,
 * GoTrue **silently** falls back to Site URL (typically https://360ghar.com).
 *
 * Critical: do NOT put `?next=…` (or any query string) on `redirectTo`. Exact
 * allowlist entries like `https://flatmates.360ghar.com/auth/callback` often
 * fail to match `…/auth/callback?next=%2Fhome`, which is why Google login on
 * flatmates was bouncing users to 360ghar.com (issue #14).
 *
 * Post-login destinations live in sessionStorage instead; the callback page
 * reads them after exchanging the OAuth code.
 *
 * Dashboard allowlist (project zthcndwkvhstjgusovqw) should include wildcards:
 *   - https://flatmates.360ghar.com/**
 *   - https://360ghar.com/**
 *   - https://tours.360ghar.com/**
 *   - https://admin.360ghar.com/**
 * Site URL stays the primary site (https://360ghar.com) — not flatmates.
 */
export const OAUTH_CALLBACK_PATH = "/auth/callback";

/** sessionStorage key for the safe relative path to open after OAuth. */
export const OAUTH_NEXT_STORAGE_KEY = "oauth:next";

interface BuildOAuthRedirectUrlOptions {
  origin?: string;
  redirectUrlOverride?: string;
  isProduction?: boolean;
}

/**
 * Build the Supabase `redirectTo` callback URL for this deployment.
 *
 * Always returns origin + `/auth/callback` with **no query string**, so it
 * matches exact and wildcard allowlist entries. Pass `next` to
 * {@link stashOAuthNext} separately before starting OAuth.
 */
export function buildOAuthRedirectUrl(
  options: BuildOAuthRedirectUrlOptions = {},
): string {
  const origin = normalizeOrigin(options.origin ?? currentOrigin());
  const isProduction = options.isProduction ?? import.meta.env.PROD;
  return isProduction
    ? callbackUrlForOrigin(origin)
    : callbackUrlForDev(origin, options.redirectUrlOverride);
}

/**
 * Persist a safe same-site path for the callback page to navigate to after
 * OAuth completes. Call immediately before `signInWithOAuth`.
 */
export function stashOAuthNext(next?: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(OAUTH_NEXT_STORAGE_KEY, resolveRedirect(next ?? null));
  } catch {
    // Private mode / quota — callback falls back to URL param or /home.
  }
}

/**
 * Read and clear the stashed post-OAuth path. Falls back to a URL `next`
 * query param (legacy / email links), then `/home`.
 */
export function consumeOAuthNext(urlNext?: string | null): string {
  let stored: string | null = null;
  if (typeof sessionStorage !== "undefined") {
    try {
      stored = sessionStorage.getItem(OAUTH_NEXT_STORAGE_KEY);
      sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY);
    } catch {
      stored = null;
    }
  }
  return resolveRedirect(stored ?? urlNext ?? null);
}

function callbackUrlForDev(
  origin: string,
  redirectUrlOverride = import.meta.env.VITE_AUTH_REDIRECT_URL,
): string {
  if (!redirectUrlOverride?.trim()) {
    return callbackUrlForOrigin(origin);
  }

  const url = new URL(redirectUrlOverride, origin);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("VITE_AUTH_REDIRECT_URL must be an http(s) URL.");
  }

  url.pathname = OAUTH_CALLBACK_PATH;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function callbackUrlForOrigin(origin: string): string {
  return new URL(OAUTH_CALLBACK_PATH, origin).toString();
}

function normalizeOrigin(origin: string): string {
  const url = new URL(origin);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("OAuth redirect origin must be an http(s) origin.");
  }
  // www.360ghar.com is 301'd to non-www; keep allowlist matches stable.
  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice(4);
  }
  return url.origin;
}

function currentOrigin(): string {
  if (typeof window === "undefined") {
    return "http://localhost";
  }
  return window.location.origin;
}
