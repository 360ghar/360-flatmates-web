import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test-utils";
import { ResendOtp } from "@/components/ui/ResendOtp";
import type { UseResendTimerReturn } from "@/hooks/useResendTimer";

function makeTimer(overrides: Partial<UseResendTimerReturn>): UseResendTimerReturn {
  return {
    remaining: 0,
    canResend: true,
    start: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };
}

describe("ResendOtp", () => {
  it("shows the remaining seconds and is disabled while cooling down", () => {
    const onResend = vi.fn();
    render(
      <ResendOtp timer={makeTimer({ remaining: 23, canResend: false })} onResend={onResend} />
    );

    const button = screen.getByRole("button", { name: /resend in 23s/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onResend).not.toHaveBeenCalled();
  });

  it("enables and triggers onResend once the cooldown elapses", () => {
    const onResend = vi.fn();
    render(
      <ResendOtp timer={makeTimer({ remaining: 0, canResend: true })} onResend={onResend} />
    );

    const button = screen.getByRole("button", { name: /resend code/i });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onResend).toHaveBeenCalledTimes(1);
  });
});
