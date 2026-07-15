import type { useResendTimer } from "@/hooks/useResendTimer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ResendOtp } from "@/components/ui/ResendOtp";
import { maskIdentifier } from "@/lib/lastAuthMethod";

const EXPECTED_OTP_LENGTH = 6;

export function ForgotPasswordOtpStep({
  identifier,
  otp,
  onOtpChange,
  submitting,
  resending,
  resendTimer,
  onResend,
  onBack,
  onSubmit
}: {
  identifier: string;
  otp: string;
  onOtpChange: (value: string) => void;
  submitting: boolean;
  resending: boolean;
  resendTimer: ReturnType<typeof useResendTimer>;
  onResend: () => void;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        label="OTP"
        placeholder={`${EXPECTED_OTP_LENGTH}-digit code`}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={EXPECTED_OTP_LENGTH}
        value={otp}
        onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, EXPECTED_OTP_LENGTH))}
        className="mt-5"
        autoFocus
        helperText={`Sent to ${maskIdentifier(identifier)}`}
      />
      <ResendOtp timer={resendTimer} onResend={onResend} loading={resending} />
      <div className="mt-5 flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
          loading={submitting}
          disabled={!otp || otp.length < EXPECTED_OTP_LENGTH}
        >
          Verify
        </Button>
      </div>
    </form>
  );
}
