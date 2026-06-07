import { useState, useCallback } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { useAuth } from "@/hooks/useAuth";
import { useWebOtp } from "@/hooks/useWebOtp";
import { useResendTimer } from "@/hooks/useResendTimer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput, formatFullPhone } from "@/components/ui/PhoneInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ResendOtp } from "@/components/ui/ResendOtp";
import { StepProgress } from "@/components/ui/StepProgress";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { OrDivider } from "@/components/ui/OrDivider";
import { PASSWORD_REGEX } from "@/lib/schemas/common";

type SignupStep = "phone" | "verify";

const STEP_LABELS = ["Enter phone", "Verify OTP"];

export function SignupPage() {
  const navigate = useNavigate();
  const { signInWithPhone, verifyOtp, signUp, signInWithGoogle, recordAuthSuccess } = useAuth();

  const [step, setStep] = useState<SignupStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const resendTimer = useResendTimer(30);

  const currentStepIndex = step === "phone" ? 0 : 1;

  // SMS OTP autofill (Android Chrome) — active only on the verify step.
  useWebOtp(step === "verify", setOtp);

  const handleGoogleSignUp = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : "Google sign-up failed. Please try again.");
    }
  }, [signInWithGoogle]);

  const handleSendOtp = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Signup: allow Supabase to create the account for this new phone.
      await signInWithPhone(formatFullPhone(phone), true);
      setStep("verify");
      resendTimer.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [signInWithPhone, phone, resendTimer]);

  const handleResendOtp = useCallback(async () => {
    setError(null);
    setResending(true);
    try {
      await signInWithPhone(formatFullPhone(phone), true);
      resendTimer.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }, [signInWithPhone, phone, resendTimer]);

  const handleVerifyAndSignUp = useCallback(async () => {
    setError(null);

    if (!password) {
      setError("Password is required.");
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError("Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    setSubmitting(true);
    try {
      const fullPhone = formatFullPhone(phone);
      await verifyOtp(fullPhone, otp);
      await signUp(fullPhone, password);
      await recordAuthSuccess("phone_otp", fullPhone);
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [verifyOtp, signUp, recordAuthSuccess, phone, otp, password, confirmPassword, acceptedTerms, navigate]);

  return (
    <>
      <SeoHelmet title="Create Account" description="Sign up for 360 Flatmates to find compatible flatmates and verified rooms across India." canonicalUrl={`${SITE_URL}/signup`} noindex />
      <StepProgress
        totalSteps={2}
        currentStep={currentStepIndex}
        variant="linear"
        labels={STEP_LABELS}
        className="mb-6"
      />

      <h1 className="text-display text-3xl md:text-4xl text-ink font-normal tracking-tight">Create account</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Join our community to discover your next <span className="text-serif-italic text-accent italic font-normal text-[18px]">compatible home</span>.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-error-soft p-3 text-caption text-error" role="alert">
          {error}
        </div>
      )}

      <Button
        fullWidth
        variant="secondary"
        className="mt-5"
        loading={googleLoading}
        onClick={handleGoogleSignUp}
      >
        <span className="flex items-center justify-center gap-2">
          <GoogleIcon className="h-4 w-4" />
          Sign up with Google
        </span>
      </Button>

      <OrDivider className="my-5" />

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
          <PhoneInput
            label="Phone number"
            value={phone}
            onChange={setPhone}
            className="mt-5"
            disabled
          />
          <Input
            label="OTP"
            placeholder="4-digit code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="mt-4"
            autoFocus
          />
          <ResendOtp timer={resendTimer} onResend={handleResendOtp} loading={resending} />
          <PasswordInput
            label="Password"
            placeholder="Min 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-4"
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
          <label className="mt-4 flex items-start gap-2 text-caption text-ink-2">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
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
              className="flex-1"
              loading={submitting}
              disabled={!otp || otp.length < 4 || !password || !confirmPassword || !acceptedTerms}
              onClick={handleVerifyAndSignUp}
            >
              Verify & Sign up
            </Button>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-body-md text-ink-2">
        Already have an account?{" "}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
