import { resolveRedirect } from "@/lib/redirect";

/**
 * OAuth redirect URL construction.
 *
 * In production this always uses the current browser origin + `/auth/callback`,
 * so a user on `https://flatmates.360ghar.com` is redirected back there after
 * Google/Apple sign-in — never to a different 360ghar host.
 *
 * IMPORTANT (Supabase dashboard requirement):
 * For this to work, the Supabase project's Authentication → URL Configuration
 * must include each deployment's callback URL in the "Redirect URLs" allowlist:
 *   - https://flatmates.360ghar.com/auth/callback
 *   - https://360ghar.com/auth/callback  (if the main site also uses OAuth)
 * The "Site URL" should be set to the primary app URL (e.g. https://flatmates.360ghar.com).
 * If a redirect URL is NOT in the allowlist, Supabase silently falls back to the
 * configured Site URL — which is the root cause of issue #14 (redirect to
 * 360ghar.com instead of flatmates.360ghar.com).
 */
export const OAUTH_CALLBACK_PATH = "/auth/callback";

interface BuildOAuthRedirectUrlOptions {
  origin?: string;
  redirectUrlOverride?: string;
  isProduction?: boolean;
}

export function buildOAuthRedirectUrl(
  next?: string,
  options: BuildOAuthRedirectUrlOptions = {},
): string {
  const origin = normalizeOrigin(options.origin ?? currentOrigin());
  const isProduction = options.isProduction ?? import.meta.env.PROD;
  const base = isProduction
    ? callbackUrlForOrigin(origin)
    : callbackUrlForDev(origin, options.redirectUrlOverride);
  const url = new URL(base);

  if (next) {
    url.searchParams.set("next", resolveRedirect(next));
  }

  return url.toString();
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
  return url.origin;
}

function currentOrigin(): string {
  if (typeof window === "undefined") {
    return "http://localhost";
  }
  return window.location.origin;
}
