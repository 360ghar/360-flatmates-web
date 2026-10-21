/**
 * Shared password policy UI text.
 *
 * Centralized so the LoginPage set-password step and the ForgotPasswordPage
 * new-password step stay in sync. (The regex lives in `@/lib/schemas/common`
 * — F10 scope. Keep this file UI-only; no validation logic.)
 *
 * TODO: Move into `src/lib/schemas/common.ts` next to `PASSWORD_REGEX` once
 * F10's divergences are unblocked. The local copy is intentional until then.
 */
export const PASSWORD_POLICY_HELPER_TEXT =
  "Min 8 chars, 1 uppercase, 1 number, 1 special character.";

export const PASSWORD_POLICY_ERROR_TEXT =
  "Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.";
