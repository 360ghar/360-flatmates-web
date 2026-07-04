import { resolveRedirect } from "@/lib/redirect";

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
