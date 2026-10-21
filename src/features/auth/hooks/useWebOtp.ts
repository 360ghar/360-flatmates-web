import { useEffect } from "react";

/**
 * WebOTP API integration for SMS one-time-code autofill on Android Chrome.
 *
 * When `enabled`, requests the most recent SMS OTP via the Credential
 * Management API (`navigator.credentials.get({ otp: { transport: ['sms'] } })`)
 * and invokes `onCode` with the parsed code when the browser delivers it.
 *
 * Requirements (handled in the Supabase SMS template, see AUTH_SETUP_CHECKLIST):
 * the SMS body's last line must be `@<domain> #<code>` for the binding to fire.
 *
 * Feature-detected (no-ops where `OTPCredential` is unavailable, e.g. desktop /
 * iOS / Firefox) and aborts the pending request on unmount or when disabled, so
 * it is safe to mount unconditionally on any OTP step.
 *
 * Reference implementation — ported verbatim to the other web apps.
 */

/** Minimal shape of the SMS OTP credential returned by the WebOTP API. */
interface OTPCredential extends Credential {
  code: string;
}

interface WebOtpRequestOptions extends CredentialRequestOptions {
  otp: { transport: string[] };
}

function isWebOtpSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "OTPCredential" in window &&
    typeof navigator !== "undefined" &&
    !!navigator.credentials
  );
}

export function useWebOtp(
  enabled: boolean,
  onCode: (code: string) => void
): void {
  useEffect(() => {
    if (!enabled || !isWebOtpSupported()) return;

    const controller = new AbortController();

    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: controller.signal,
      } as WebOtpRequestOptions)
      .then((credential) => {
        const otp = credential as OTPCredential | null;
        if (otp?.code) {
          onCode(otp.code);
        }
      })
      .catch(() => {
        /* aborted on unmount, or user dismissed — nothing to do */
      });

    return () => controller.abort();
    // `onCode` is intentionally excluded: callers pass a stable setter and we
    // only want to (re)issue the request when `enabled` flips.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
