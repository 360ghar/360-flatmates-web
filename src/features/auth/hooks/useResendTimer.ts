import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Resend-OTP cooldown timer.
 *
 * Drives a standardized "Resend in 23s" countdown across every OTP step. Call
 * {@link UseResendTimerReturn.start | start()} when an OTP is sent (or resent)
 * to begin a `seconds`-long countdown. While `remaining > 0` the resend control
 * should be disabled and show `remaining`; once it hits 0, `canResend` is true.
 *
 * The countdown is interval-based and self-cleaning (cleared on unmount). It is
 * framework-free beyond React, so it ports directly to the other web apps.
 *
 * @param seconds Cooldown duration in seconds. Defaults to 30.
 *
 * @example
 * const resend = useResendTimer(30);
 * // after sending the OTP:
 * resend.start();
 * // in the UI:
 * <button disabled={!resend.canResend} onClick={handleResend}>
 *   {resend.canResend ? "Resend code" : `Resend in ${resend.remaining}s`}
 * </button>
 */
export interface UseResendTimerReturn {
  /** Seconds left in the cooldown (0 when resend is allowed). */
  remaining: number;
  /** True once the cooldown has elapsed (i.e. `remaining === 0`). */
  canResend: boolean;
  /** (Re)start the cooldown from the full duration. Call after each send. */
  start: () => void;
  /** Cancel the cooldown immediately (resets to 0 / resend allowed). */
  reset: () => void;
}

export function useResendTimer(seconds = 30): UseResendTimerReturn {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clear();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [seconds, clear]);

  const reset = useCallback(() => {
    clear();
    setRemaining(0);
  }, [clear]);

  // Clean up the interval on unmount.
  useEffect(() => clear, [clear]);

  return { remaining, canResend: remaining === 0, start, reset };
}
