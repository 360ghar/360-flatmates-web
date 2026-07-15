import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ResendOtp } from "@/components/ui/ResendOtp";
import type { UseResendTimerReturn } from "@/hooks/useResendTimer";

const EXPECTED_OTP_LENGTH = 6;

interface LoginOtpStepProps {
  otp: string;
  mustSetPassword: boolean;
  channel: "phone" | "email";
  resolvedIdentifier: string;
  identifier: string;
  submitting: boolean;
  resendTimer: UseResendTimerReturn;
  resending: boolean;
  onOtpChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onResend: () => void;
}

export function LoginOtpStep({
  otp,
  mustSetPassword,
  channel,
  resolvedIdentifier,
  identifier,
  submitting,
  resendTimer,
  resending,
  onOtpChange,
  onBack,
  onSubmit,
  onResend,
}: LoginOtpStepProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        label="Verification code"
        placeholder={`${EXPECTED_OTP_LENGTH}-digit code`}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={EXPECTED_OTP_LENGTH}
        value={otp}
        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, EXPECTED_OTP_LENGTH))}
        className="mt-4"
        autoFocus
        helperText={`Sent to ${channel === "phone" ? resolvedIdentifier : identifier.trim()}`}
      />
      <div className="mt-4 flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={submitting}
          disabled={otp.length < EXPECTED_OTP_LENGTH}
        >
          {mustSetPassword ? "Verify & continue" : "Verify"}
        </Button>
      </div>
      <ResendOtp timer={resendTimer} onResend={onResend} loading={resending} />
    </form>
  );
}
