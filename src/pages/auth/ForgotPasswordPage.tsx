import { useState, useCallback } from "react";
import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { useAuth } from "@/hooks/useAuth";
import { useResendTimer } from "@/hooks/useResendTimer";
import { useWebOtp } from "@/hooks/useWebOtp";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatFullPhone } from "@/components/ui/PhoneInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ResendOtp } from "@/components/ui/ResendOtp";
import { StepProgress } from "@/components/ui/StepProgress";
import { PASSWORD_REGEX } from "@/lib/schemas/common";
import { maskIdentifier } from "@/lib/lastAuthMethod";

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
  const { signInWithPhone, signInWithEmailOtp, verifyOtp, verifyEmailOtp, updateUser } = useAuth();

  const [step, setStep] = useState<ResetStep>("request");
  /** Raw value from the single identifier field (email or phone). */
  const [input, setInput] = useState("");
  /** The exact identifier (E.164 phone or trimmed email) the OTP was sent to. */
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const resendTimer = useResendTimer(30);

  // Channel is derived from the single identifier field.
  const channel: Channel = detectChannel(input);

  // SMS OTP autofill (Android Chrome) — only on the verify step for phone.
  useWebOtp(step === "verify" && channel === "phone", setOtp);

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
    const target = channel === "phone" ? formatFullPhone(input) : input.trim();
    try {
      await sendResetOtp(target);
      setIdentifier(target);
      setStep("verify");
      resendTimer.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code. Please try again.");
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
      setError(err instanceof Error ? err.message : "Failed to resend code. Please try again.");
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
      setError("Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await updateUser(newPassword);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [updateUser, newPassword, confirmPassword]);

  if (success) {
    return (
      <>
        <SeoHelmet title="Password Reset" description="Reset your 360 Flatmates password." canonicalUrl={`${SITE_URL}/forgot-password`} noindex />
        <h1 className="text-display text-3xl md:text-4xl text-ink font-normal tracking-tight">Password reset</h1>
        <p className="mt-3 text-body-md text-ink-2">
          Your password has been updated successfully. You can now sign in with your new credentials.
        </p>
        <Link to="/login" className={buttonClasses("primary", "default", true) + " mt-6"}>
          Back to Login
        </Link>
      </>
    );
  }

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
        <>
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
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={input.trim().length < 3}
            onClick={handleRequest}
          >
            Send OTP
          </Button>
        </>
      )}

      {/* Step 2 — verify OTP (both channels) */}
      {step === "verify" && (() => {
        const expectedOtpLength = channel === "phone" ? 4 : 6;
        return (
          <>
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
                className="flex-1"
                loading={submitting}
                disabled={!otp || otp.length < expectedOtpLength}
                onClick={handleVerifyOtp}
              >
                Verify
              </Button>
            </div>
          </>
        );
      })()}

      {/* Step 3 — set new password (both channels) */}
      {step === "new-password" && (
        <>
          <PasswordInput
            label="New password"
            placeholder="Min 8 characters"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-5"
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-4"
          />
          <div className="mt-3 rounded-xl bg-paper-2 p-3 text-caption text-ink-2">
            Min 8 chars, 1 uppercase, 1 number, 1 special character.
          </div>
          <Button
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={!newPassword || !confirmPassword}
            onClick={handleResetPassword}
          >
            Reset Password
          </Button>
        </>
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
