import { apiClient } from "@/lib/api";
import type { AuthMethod } from "@/lib/lastAuthMethod";

/**
 * Auth state-machine + bookkeeping endpoints (frozen backend contract).
 *
 * - `POST /api/v1/auth/identifier-status` (PUBLIC): drives the login
 *   verified-vs-unverified branch.
 * - `POST /api/v1/auth/last-method` (AUTH): records the method used on each
 *   successful auth so other surfaces can read `last_auth_method`.
 *
 * Reference implementation — ported to the other web apps next to their auth
 * service.
 */

export type IdentifierChannel = "email" | "phone";
export type IdentifierNextStep = "password" | "otp";

/**
 * Heuristically classify a raw identifier as an email or a phone number.
 * A value containing `@` (or any non-digit other than leading `+`/spaces) is
 * treated as email; otherwise it is treated as phone. Used to render the right
 * input affordances and to optimistically pick OTP/password channels.
 */
export function detectIdentifierChannel(identifier: string): IdentifierChannel {
  const value = identifier.trim();
  if (value.includes("@")) return "email";
  // If it's all digits / phone punctuation, it's a phone; otherwise email.
  return /^[+\d][\d\s()-]*$/.test(value) ? "phone" : "email";
}

export interface IdentifierStatus {
  exists: boolean;
  verified: boolean;
  has_password: boolean;
  channel: IdentifierChannel;
  /** `password` iff exists && verified && has_password, else `otp`. */
  next_step: IdentifierNextStep;
}

/**
 * Ask the backend how to proceed for a given identifier (email or phone).
 * Public + rate-limited + neutral response shape (no user enumeration leak).
 */
export function checkIdentifierStatus(
  identifier: string,
  signal?: AbortSignal
): Promise<IdentifierStatus> {
  return apiClient.request<IdentifierStatus, { identifier: string }>({
    method: "POST",
    path: "/auth/identifier-status",
    body: { identifier },
    auth: false,
    signal,
  });
}

/**
 * Record the last successful auth method for the signed-in user.
 * Returns 204 on success; failures are non-fatal to the auth flow, so callers
 * should treat this as best-effort (see `reportLastMethod`).
 */
export function postLastMethod(method: AuthMethod): Promise<void> {
  return apiClient.request<void, { method: AuthMethod }>({
    method: "POST",
    path: "/auth/last-method",
    body: { method },
    auth: true,
  });
}

/**
 * Best-effort wrapper around {@link postLastMethod}: never throws, so a failing
 * bookkeeping call cannot break an otherwise-successful sign-in.
 */
export async function reportLastMethod(method: AuthMethod): Promise<void> {
  try {
    await postLastMethod(method);
  } catch {
    /* best-effort — auth already succeeded */
  }
}

// ── Auth gate-state (centralized gate model) ─────────────────────────────────
// The gate model: IDENTIFIER_VERIFICATION -> PASSWORD_SETUP -> PROFILE_COMPLETION
// -> APP_ONBOARDING -> ACTIVE.  Computed on the backend; the client reads it
// from GET /users/me/auth-state and routes accordingly.

export type AuthStage =
  | "identifier_verification"
  | "password_setup"
  | "profile_completion"
  | "app_onboarding"
  | "active";

export interface AuthStateResponse {
  stage: AuthStage;
  next_action: string;
  missing_fields: string[];
}

/**
 * Fetch the current auth gate stage from the backend.
 * Requires an authenticated session (the access token is attached by the apiClient).
 *
 * @param app the app slug whose onboarding to check (defaults to "flatmates").
 */
export function getAuthState(
  app: string = "flatmates",
  signal?: AbortSignal
): Promise<AuthStateResponse> {
  return apiClient.request<AuthStateResponse, { app: string }>({
    method: "GET",
    path: "/users/me/auth-state",
    query: { app },
    auth: true,
    signal,
  });
}
