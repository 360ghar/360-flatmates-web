import { useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { useAuth } from "@/hooks/useAuth";
import { useResendTimer } from "@/hooks/useResendTimer";
import { useWebOtp } from "@/hooks/useWebOtp";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ResendOtp } from "@/components/ui/ResendOtp";
import { StepProgress } from "@/components/ui/StepProgress";
import { PASSWORD_REGEX } from "@/lib/schemas/common";
import { maskIdentifier } from "@/lib/lastAuthMethod";
import { authStore } from "@/lib/stores/auth-store";
import { uiStore } from "@/lib/stores/ui-store";
import { normalizePhone } from "@/lib/redirect";
import { PASSWORD_POLICY_HELPER_TEXT, PASSWORD_POLICY_ERROR_TEXT } from "./_password-policy";
import { checkIdentifierStatus } from "@/lib/api/auth";
import {
  mapSupabaseAuthError,
  NO_ACCOUNT_FOUND_MESSAGE,
  IDENTIFIER_STATUS_UNAVAILABLE_MESSAGE,
} from "@/lib/authErrors";

/**
 * Password reset — 6-digit OTP for BOTH channels (decision 1).
 *
 *   request (phone or email) → verify OTP → new-password
 *
 * Phone: `signInWithPhone` → `verifyOtp({ type: 'sms' })`.
 * Email: `signInWithEmailOtp` → `verifyOtp({ type: 'email' })`.
 * Both then call `updateUser({ password })`. The OTP send uses
 * `shouldCreateUser: false` so reset never silently creates an account.
 *
 * The OTP verify already proved identity and created a session, so a
 * successful reset keeps the user signed in and continues into the app —
 * no second login with the new password.
 *
 * Reference app — no magic-link / `resetPasswordForEmail`; both channels are
 * unified through the same verify + set-password steps.
 */
type ResetStep = "request" | "verify" | "new-password";
type Channel = "phone" | "email";

const STEP_LABELS = ["Enter identifier", "Enter OTP", "New password"];

/** Detect whether the input looks like an email (contains @) or a phone number. */
function detectChannel(value: string): Channel {
  return value.trim().includes("@") ? "email" : "phone";
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    signInWithPhone,
    signInWithEmailOtp,
    verifyOtp,
    verifyEmailOtp,
    updateUser,
    recordAuthSuccess,
  } = useAuth();

  const [step, setStep] = useState<ResetStep>("request");
  /** Raw value from the single identifier field (email or phone). */
  const [input, setInput] = useState("");
  /** The exact identifier (E.164 phone or trimmed email) the OTP was sent to. */
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const resendTimer = useResendTimer(30);

  // Channel is derived from the single identifier field.
  const channel: Channel = detectChannel(input);

  // SMS OTP autofill (Android Chrome) — only on the verify step for phone.
  useWebOtp(step === "verify" && channel === "phone", setOtp);

  // The OTP verify signs the user in before the new password is set. Hold
  // AuthRedirectGuard so it cannot bounce the user to /home mid-flow.
  useEffect(() => {
    authStore.getState().setMidAuthFlow(step === "verify" || step === "new-password");
    return () => authStore.getState().setMidAuthFlow(false);
  }, [step]);

  const currentStepIndex = step === "request" ? 0 : step === "verify" ? 1 : 2;

  /** Send the reset OTP for an already-resolved identifier. Never creates an account. */
  const sendResetOtp = useCallback(
    async (target: string) => {
      if (detectChannel(target) === "phone") {
        await signInWithPhone(target, false);
      } else {
        await signInWithEmailOtp(target, false);
      }
    },
    [signInWithPhone, signInWithEmailOtp]
  );

  const handleRequest = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    const target = channel === "phone" ? normalizePhone(input) : input.trim();
    try {
      let status;
      try {
        status = await checkIdentifierStatus(target);
      } catch (err: unknown) {
        // Prefer the dedicated copy for network/5xx so users don't see a
        // generic Supabase mapping when the status endpoint itself is down.
        // Do NOT treat every error without a status as network (would hide
        // real 4xx / validation messages).
        const statusCode =
          err && typeof err === "object" && "status" in err
            ? Number((err as { status?: number }).status)
            : undefined;
        const appType =
          err &&
          typeof err === "object" &&
          "appError" in err &&
          err.appError &&
          typeof err.appError === "object" &&
          "type" in (err.appError as object)
            ? String((err.appError as { type?: string }).type)
            : undefined;
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        const isNetworkOrServer =
          appType === "network" ||
          appType === "timeout" ||
          appType === "server" ||
          (statusCode !== undefined &&
            (statusCode === 0 || statusCode >= 500)) ||
          msg.includes("network") ||
          msg.includes("failed to fetch") ||
          msg.includes("timeout") ||
          msg.includes("econnrefused") ||
          msg.includes("unavailable");
        setError(
          isNetworkOrServer
            ? IDENTIFIER_STATUS_UNAVAILABLE_MESSAGE
            : mapSupabaseAuthError(err, "forgot_password")
        );
        return;
      }
      if (!status.exists) {
        setError(NO_ACCOUNT_FOUND_MESSAGE);
        return;
      }
      await sendResetOtp(target);
      setIdentifier(target);
      setStep("verify");
      resendTimer.start();
    } catch (err: unknown) {
      setError(mapSupabaseAuthError(err, "forgot_password"));
    } finally {
      setSubmitting(false);
    }
  }, [channel, input, sendResetOtp, resendTimer]);

  const handleResendOtp = useCallback(async () => {
    setError(null);
    setResending(true);
    try {
      await sendResetOtp(identifier);
      resendTimer.start();
    } catch (err: unknown) {
      setError(mapSupabaseAuthError(err, "forgot_password"));
    } finally {
      setResending(false);
    }
  }, [sendResetOtp, identifier, resendTimer]);

  const handleVerifyOtp = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (channel === "phone") {
        await verifyOtp(identifier, otp);
      } else {
        await verifyEmailOtp(identifier, otp);
      }
      setStep("new-password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [channel, verifyOtp, verifyEmailOtp, identifier, otp]);

  const handleResetPassword = useCallback(async () => {
    setError(null);

    if (!PASSWORD_REGEX.test(newPassword)) {
      setError(PASSWORD_POLICY_ERROR_TEXT);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    // Core operation — must succeed. The OTP verify already created a session,
    // so on success the user stays signed in with the new password.
    try {
      await updateUser(newPassword);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
      setSubmitting(false);
      return;
    }

    // Recording the auth method is best-effort: by now the password is reset
    // and the session is live, so a backend hiccup here must not strand the
    // user with a misleading "failed to reset" error.
    try {
      await recordAuthSuccess(
        channel === "phone" ? "phone_password" : "email_password",
        identifier
      );
    } catch {
      // Non-fatal — proceed into the app with the live session.
    }

    uiStore.getState().pushToast({
      type: "success",
      title: "Password updated",
      description: "You're signed in with your new password."
    });
    navigate("/home", { replace: true });
    setSubmitting(false);
  }, [updateUser, recordAuthSuccess, channel, identifier, newPassword, confirmPassword, navigate]);

  return (
    <>
      <SeoHelmet title="Reset Password" description="Reset your 360 Flatmates account password via a 6-digit OTP." canonicalUrl={`${SITE_URL}/forgot-password`} noindex />
      <h1 className="text-display text-3xl md:text-4xl text-ink font-normal tracking-tight">Reset password</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Verify your credentials to secure your <span className="text-serif-italic text-accent italic font-normal text-[18px]">account access</span>.
      </p>

      <StepProgress
        totalSteps={3}
        currentStep={currentStepIndex}
        variant="linear"
        labels={STEP_LABELS}
        className="mt-5"
      />

      {error && (
        <div className="mt-4 rounded-xl bg-error-soft p-3 text-caption text-error" role="alert">
          {error}
        </div>
      )}

      {/* Step 1 — request: single identifier field (email or phone, auto-detected) */}
      {step === "request" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRequest();
          }}
        >
          <Input
            label="Phone or email"
            type={channel === "phone" ? "tel" : "text"}
            inputMode={channel === "phone" ? "tel" : undefined}
            autoComplete="username"
            placeholder="you@example.com or 98765 43210"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mt-5"
            autoFocus
          />
          <Button
            type="submit"
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={input.trim().length < 3}
          >
            Send OTP
          </Button>
        </form>
      )}

      {/* Step 2 — verify OTP (both channels) */}
      {step === "verify" && (() => {
        const expectedOtpLength = 6;
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyOtp();
            }}
          >
            <Input
              label="OTP"
              placeholder={`${expectedOtpLength}-digit code`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={expectedOtpLength}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, expectedOtpLength))}
              className="mt-5"
              autoFocus
              helperText={`Sent to ${maskIdentifier(identifier)}`}
            />
            <ResendOtp timer={resendTimer} onResend={handleResendOtp} loading={resending} />
            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setStep("request");
                  setOtp("");
                  setError(null);
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={submitting}
                disabled={!otp || otp.length < expectedOtpLength}
              >
                Verify
              </Button>
            </div>
          </form>
        );
      })()}

      {/* Step 3 — set new password (both channels) */}
      {step === "new-password" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleResetPassword();
          }}
        >
          <PasswordInput
            label="New password"
            placeholder="Min 8 characters"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-5"
            autoFocus
            helperText={PASSWORD_POLICY_HELPER_TEXT}
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-4"
          />
          <Button
            type="submit"
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={!newPassword || !confirmPassword}
          >
            Reset Password
          </Button>
        </form>
      )}

      <Link
        to="/login"
        className="mt-4 inline-flex text-label-md text-accent hover:underline"
      >
        Back to Login
      </Link>
    </>
  );
}
