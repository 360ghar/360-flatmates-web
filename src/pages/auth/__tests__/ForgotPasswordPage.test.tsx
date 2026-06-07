import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test-utils";
import { waitFor } from "@testing-library/react";

vi.mock("@/lib/seo", () => ({
  SeoHelmet: () => null,
  SITE_URL: "https://test.local",
}));

vi.mock("@/hooks/useWebOtp", () => ({ useWebOtp: () => {} }));

vi.mock("@/lib/lastAuthMethod", () => ({
  maskIdentifier: (v: string) => v,
}));

const mockSignInWithPhone = vi.fn();
const mockSignInWithEmailOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockVerifyEmailOtp = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    signInWithPhone: mockSignInWithPhone,
    signInWithEmailOtp: mockSignInWithEmailOtp,
    verifyOtp: mockVerifyOtp,
    verifyEmailOtp: mockVerifyEmailOtp,
    updateUser: mockUpdateUser,
  }),
}));

import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";

const VALID_PASSWORD = "Password1!";

describe("ForgotPasswordPage — OTP reset for both channels (decision 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithPhone.mockResolvedValue(undefined);
    mockSignInWithEmailOtp.mockResolvedValue(undefined);
    mockVerifyOtp.mockResolvedValue(undefined);
    mockVerifyEmailOtp.mockResolvedValue(undefined);
    mockUpdateUser.mockResolvedValue(undefined);
  });

  it("resets via EMAIL OTP (no magic link): email OTP → verify(email) → updateUser", async () => {
    render(<ForgotPasswordPage />);

    // Typing an email switches the channel to email.
    fireEvent.change(screen.getByLabelText(/phone or email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send otp/i }));

    // Email OTP send must NOT create an account.
    await waitFor(() =>
      expect(mockSignInWithEmailOtp).toHaveBeenCalledWith("jane@example.com", false)
    );

    // Verify the 6-digit email OTP.
    const otp = await screen.findByLabelText(/otp/i);
    fireEvent.change(otp, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(mockVerifyEmailOtp).toHaveBeenCalledWith("jane@example.com", "123456")
    );

    // Set the new password → updateUser.
    fireEvent.change(await screen.findByLabelText(/new password/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(VALID_PASSWORD));
    // No magic-link reset path is used.
    expect(screen.getByText(/password reset/i)).toBeInTheDocument();
  });

  it("resets via PHONE OTP with shouldCreateUser:false", async () => {
    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText(/phone or email/i), {
      target: { value: "9876543210" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send otp/i }));

    await waitFor(() =>
      expect(mockSignInWithPhone).toHaveBeenCalledWith("+919876543210", false)
    );

    fireEvent.change(await screen.findByLabelText(/otp/i), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(mockVerifyOtp).toHaveBeenCalledWith("+919876543210", "1234")
    );
  });
});
