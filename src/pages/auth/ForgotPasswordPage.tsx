import { useState, useCallback } from "react";
import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { useAuth } from "@/hooks/useAuth";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput, formatFullPhone } from "@/components/ui/PhoneInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { StepProgress } from "@/components/ui/StepProgress";
import { PASSWORD_REGEX } from "@/lib/schemas/common";

type ResetStep = "phone" | "verify" | "new-password";

const STEP_LABELS = ["Verify phone", "Enter OTP", "New password"];

export function ForgotPasswordPage() {
  const { signInWithPhone, verifyOtp, updateUser } = useAuth();

  const [step, setStep] = useState<ResetStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentStepIndex = step === "phone" ? 0 : step === "verify" ? 1 : 2;

  const handleSendOtp = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPhone(formatFullPhone(phone));
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [signInWithPhone, phone]);

  const handleVerifyOtp = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(formatFullPhone(phone), otp);
      setStep("new-password");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [verifyOtp, phone, otp]);

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
        <h1 className="text-h1">Password reset</h1>
        <p className="mt-3 text-body-md text-ink-2">
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <Link to="/login" className={buttonClasses("primary", "default", true) + " mt-6"}>
          Back to Login
        </Link>
      </>
    );
  }

  return (
    <>
      <SeoHelmet title="Reset Password" description="Reset your 360 Flatmates account password via phone OTP verification." canonicalUrl={`${SITE_URL}/forgot-password`} noindex />
      <h1 className="text-h1">Reset Password</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Enter your phone number, verify the code, then set a new password.
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

      {step === "phone" && (
        <>
          <PhoneInput
            label="Phone number"
            value={phone}
            onChange={setPhone}
            className="mt-5"
            autoFocus
          />
          <Button
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={phone.length < 10}
            onClick={handleSendOtp}
          >
            Send OTP
          </Button>
        </>
      )}

      {step === "verify" && (
        <>
          <Input
            label="OTP"
            placeholder="6-digit code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mt-5"
            autoFocus
          />
          <div className="mt-5 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
            >
              Back
            </Button>
            <Button
              fullWidth
              loading={submitting}
              disabled={!otp || otp.length < 6}
              onClick={handleVerifyOtp}
            >
              Verify
            </Button>
          </div>
        </>
      )}

      {step === "new-password" && (
        <>
          <PasswordInput
            label="New password"
            placeholder="Min 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-5"
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter password"
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
