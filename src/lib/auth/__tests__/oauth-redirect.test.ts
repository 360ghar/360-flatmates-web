import { describe, expect, it } from "vitest";

import { buildOAuthRedirectUrl } from "@/lib/auth/oauth-redirect";

describe("buildOAuthRedirectUrl", () => {
  it("uses the current flatmates origin in production", () => {
    expect(
      buildOAuthRedirectUrl(undefined, {
        origin: "https://flatmates.360ghar.com",
        redirectUrlOverride: "https://360ghar.com",
        isProduction: true,
      }),
    ).toBe("https://flatmates.360ghar.com/auth/callback");
  });

  it("preserves a safe next path", () => {
    expect(
      buildOAuthRedirectUrl("/swipe", {
        origin: "https://flatmates.360ghar.com",
        isProduction: true,
      }),
    ).toBe("https://flatmates.360ghar.com/auth/callback?next=%2Fswipe");
  });

  it("falls back to home for unsafe next targets", () => {
    expect(
      buildOAuthRedirectUrl("https://360ghar.com", {
        origin: "https://flatmates.360ghar.com",
        isProduction: true,
      }),
    ).toBe("https://flatmates.360ghar.com/auth/callback?next=%2Fhome");
  });

  it("normalizes a development override to the OAuth callback path", () => {
    expect(
      buildOAuthRedirectUrl(undefined, {
        origin: "https://flatmates.360ghar.com",
        redirectUrlOverride: "http://localhost:5173",
        isProduction: false,
      }),
    ).toBe("http://localhost:5173/auth/callback");
  });

  it("rejects non-http development overrides", () => {
    expect(() =>
      buildOAuthRedirectUrl(undefined, {
        origin: "https://flatmates.360ghar.com",
        redirectUrlOverride: "com.the360ghar.flatmates360://login-callback",
        isProduction: false,
      }),
    ).toThrow("VITE_AUTH_REDIRECT_URL must be an http(s) URL.");
  });
});
