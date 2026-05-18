import { useState, useCallback } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput, formatFullPhone } from "@/components/ui/PhoneInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { StepProgress } from "@/components/ui/StepProgress";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { OrDivider } from "@/components/ui/OrDivider";
import { PASSWORD_REGEX } from "@/lib/schemas/common";

type SignupStep = "phone" | "verify";

const STEP_LABELS = ["Enter phone", "Verify OTP"];

export function SignupPage() {
  const navigate = useNavigate();
  const { signInWithPhone, verifyOtp, signUp, signInWithGoogle } = useAuth();

  const [step, setStep] = useState<SignupStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const currentStepIndex = step === "phone" ? 0 : 1;

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
      await signInWithPhone(formatFullPhone(phone));
      setStep("verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [signInWithPhone, phone]);

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

    setSubmitting(true);
    try {
      const fullPhone = formatFullPhone(phone);
      await verifyOtp(fullPhone, otp);
      await signUp(fullPhone, password);
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [verifyOtp, signUp, phone, otp, password, confirmPassword, navigate]);

  return (
    <>
      <StepProgress
        totalSteps={2}
        currentStep={currentStepIndex}
        variant="linear"
        labels={STEP_LABELS}
        className="mb-6"
      />

      <h1 className="text-h1">Create account</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Enter your phone number, verify with OTP, and set a password.
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
            placeholder="6-digit code"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mt-4"
            autoFocus
          />
          <PasswordInput
            label="Password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-4"
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
              disabled={!otp || otp.length < 6 || !password || !confirmPassword}
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
