import { Button } from "./Button";
import { cn } from "./component-utils";
import type { UseResendTimerReturn } from "@/hooks/useResendTimer";

interface ResendOtpProps {
  /** Timer instance from {@link useResendTimer} (owned by the parent step). */
  timer: UseResendTimerReturn;
  /** Triggered when the user taps Resend (only callable once the timer hits 0). */
  onResend: () => void;
  /** True while the resend request is in flight. */
  loading?: boolean;
  className?: string;
}

/**
 * Standardized resend-OTP control.
 *
 * Disabled while the cooldown is running, showing the remaining seconds
 * ("Resend in 23s"); enabled once the countdown reaches 0. Pair with
 * {@link useResendTimer} (default 30s) — the parent OTP step calls
 * `timer.start()` after each (re)send.
 *
 * Reference implementation: copy `useResendTimer` + this component into the
 * other web apps to keep the resend UX identical everywhere.
 */
export function ResendOtp({ timer, onResend, loading = false, className }: ResendOtpProps) {
  return (
    <div className={cn("mt-3 flex items-center justify-center text-caption text-ink-3", className)}>
      <span>Didn&apos;t get the code?</span>
      <Button
        variant="tertiary"
        size="compact"
        className="ml-1 px-2"
        loading={loading}
        disabled={!timer.canResend}
        onClick={onResend}
      >
        {timer.canResend ? "Resend code" : `Resend in ${timer.remaining}s`}
      </Button>
    </div>
  );
}
