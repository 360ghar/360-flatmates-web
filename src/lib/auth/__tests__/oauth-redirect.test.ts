import { afterEach, describe, expect, it } from "vitest";

import {
  buildOAuthRedirectUrl,
  consumeOAuthNext,
  OAUTH_NEXT_STORAGE_KEY,
  stashOAuthNext,
} from "@/lib/auth/oauth-redirect";

describe("buildOAuthRedirectUrl", () => {
  it("uses the current flatmates origin in production (no query string)", () => {
    expect(
      buildOAuthRedirectUrl({
        origin: "https://flatmates.360ghar.com",
        redirectUrlOverride: "https://360ghar.com",
        isProduction: true,
      }),
    ).toBe("https://flatmates.360ghar.com/auth/callback");
  });

  it("strips www so allowlist matches stay stable", () => {
    expect(
      buildOAuthRedirectUrl({
        origin: "https://www.flatmates.360ghar.com",
        isProduction: true,
      }),
    ).toBe("https://flatmates.360ghar.com/auth/callback");
  });

  it("never embeds next in the Supabase redirect URL", () => {
    // Previous bug: ?next= caused allowlist mismatch → Site URL fallback.
    const url = buildOAuthRedirectUrl({
      origin: "https://flatmates.360ghar.com",
      isProduction: true,
    });
    expect(url).toBe("https://flatmates.360ghar.com/auth/callback");
    expect(url).not.toContain("next");
    expect(url).not.toContain("?");
  });

  it("normalizes a development override to the OAuth callback path", () => {
    expect(
      buildOAuthRedirectUrl({
        origin: "https://flatmates.360ghar.com",
        redirectUrlOverride: "http://localhost:5173",
        isProduction: false,
      }),
    ).toBe("http://localhost:5173/auth/callback");
  });

  it("rejects non-http development overrides", () => {
    expect(() =>
      buildOAuthRedirectUrl({
        origin: "https://flatmates.360ghar.com",
        redirectUrlOverride: "com.the360ghar.flatmates360://login-callback",
        isProduction: false,
      }),
    ).toThrow("VITE_AUTH_REDIRECT_URL must be an http(s) URL.");
  });
});

describe("stashOAuthNext / consumeOAuthNext", () => {
  afterEach(() => {
    sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY);
  });

  it("round-trips a safe next path via sessionStorage", () => {
    stashOAuthNext("/swipe");
    expect(consumeOAuthNext()).toBe("/swipe");
    // Second consume should not see the stashed value.
    expect(consumeOAuthNext()).toBe("/home");
  });

  it("rejects absolute/external next targets", () => {
    stashOAuthNext("https://360ghar.com");
    expect(consumeOAuthNext()).toBe("/home");
  });

  it("falls back to URL next when storage is empty", () => {
    expect(consumeOAuthNext("/discover")).toBe("/discover");
  });

  it("defaults to /home when nothing is available", () => {
    expect(consumeOAuthNext(null)).toBe("/home");
  });
});
