import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { useAuth } from "@/hooks/useAuth";
import { useWebOtp } from "@/hooks/useWebOtp";
import { useResendTimer } from "@/hooks/useResendTimer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PhoneInput, formatFullPhone } from "@/components/ui/PhoneInput";
import { ResendOtp } from "@/components/ui/ResendOtp";
import { StepProgress } from "@/components/ui/StepProgress";

/**
 * Post-Google add-phone interstitial (skippable).
 *
 * Google sign-ups are passwordless and may have no phone. After the OAuth
 * callback, users without a phone land here to optionally add + verify one
 * (`updateUser({ phone })` → `verifyOtp({ type: 'phone_change' })`). It is
 * always skippable — the user is already authenticated.
 *
 * If the user already has a phone (e.g. navigated here manually), we redirect
 * straight to /home.
 */
type AddPhoneStep = "phone" | "verify";

const STEP_LABELS = ["Add phone", "Verify"];

export function AddPhonePage() {
  const navigate = useNavigate();
  const { user, addPhone, verifyPhoneChange } = useAuth();

  const [step, setStep] = useState<AddPhoneStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const resendTimer = useResendTimer(30);

  // Active only on the verify step (Android Chrome SMS autofill).
  useWebOtp(step === "verify", setOtp);

  // Already has a phone → nothing to do here.
  useEffect(() => {
    if (typeof user?.phone === "string" && user.phone.length > 0) {
      navigate("/home", { replace: true });
    }
  }, [user?.phone, navigate]);

  const handleSendOtp = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      await addPhone(formatFullPhone(phone));
      setStep("verify");
      resendTimer.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [addPhone, phone, resendTimer]);

  const handleResendOtp = useCallback(async () => {
    setError(null);
    setResending(true);
    try {
      await addPhone(formatFullPhone(phone));
      resendTimer.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }, [addPhone, phone, resendTimer]);

  const handleVerify = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      await verifyPhoneChange(formatFullPhone(phone), otp);
      navigate("/home", { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [verifyPhoneChange, phone, otp, navigate]);

  const handleSkip = useCallback(() => {
    navigate("/home", { replace: true });
  }, [navigate]);

  return (
    <>
      <SeoHelmet title="Add Phone" description="Add a phone number to your 360 Flatmates account." canonicalUrl={`${SITE_URL}/add-phone`} noindex />
      <StepProgress
        totalSteps={2}
        currentStep={step === "phone" ? 0 : 1}
        variant="linear"
        labels={STEP_LABELS}
        className="mb-6"
      />

      <h1 className="text-display text-3xl md:text-4xl text-ink font-normal tracking-tight">Add your phone</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Add a verified phone so flatmates can reach you. You can always do this <span className="text-serif-italic text-accent italic font-normal text-[18px]">later</span>.
      </p>

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
          <PhoneInput
            label="Phone number"
            value={phone}
            onChange={setPhone}
            className="mt-5"
            disabled
          />
          <Input
            label="Verification code"
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
              disabled={otp.length < 4}
              onClick={handleVerify}
            >
              Verify
            </Button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={handleSkip}
        className="mt-6 w-full text-center text-body-md text-ink-3 hover:text-accent transition-colors"
      >
        Skip for now
      </button>
    </>
  );
}
