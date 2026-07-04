import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test-utils";
import { waitFor } from "@testing-library/react";

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/lib/seo", () => ({
  SeoHelmet: () => null,
  SITE_URL: "https://test.local",
}));

vi.mock("@/hooks/useWebOtp", () => ({ useWebOtp: () => {} }));

vi.mock("@/lib/lastAuthMethod", () => ({
  maskIdentifier: (v: string) => v,
}));

const mockCheckIdentifierStatus = vi.fn();

vi.mock("@/lib/api/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api/auth")>();
  return {
    ...actual,
    checkIdentifierStatus: (...args: unknown[]) => mockCheckIdentifierStatus(...args),
  };
});

const mockSignInWithPhone = vi.fn();
const mockSignInWithEmailOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockVerifyEmailOtp = vi.fn();
const mockUpdateUser = vi.fn();
const mockRecordAuthSuccess = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    signInWithPhone: mockSignInWithPhone,
    signInWithEmailOtp: mockSignInWithEmailOtp,
    verifyOtp: mockVerifyOtp,
    verifyEmailOtp: mockVerifyEmailOtp,
    updateUser: mockUpdateUser,
    recordAuthSuccess: mockRecordAuthSuccess,
  }),
}));

import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";

const VALID_PASSWORD = "Password1!";

describe("ForgotPasswordPage — OTP reset for both channels (decision 1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckIdentifierStatus.mockResolvedValue({
      exists: true,
      verified: true,
      has_password: true,
      channel: "email",
      next_step: "password",
    });
    mockSignInWithPhone.mockResolvedValue(undefined);
    mockSignInWithEmailOtp.mockResolvedValue(undefined);
    mockVerifyOtp.mockResolvedValue(undefined);
    mockVerifyEmailOtp.mockResolvedValue(undefined);
    mockUpdateUser.mockResolvedValue(undefined);
    mockRecordAuthSuccess.mockResolvedValue(undefined);
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
    // Stay signed in: the password method is recorded and the user continues
    // into the app — no second login.
    await waitFor(() =>
      expect(mockRecordAuthSuccess).toHaveBeenCalledWith(
        "email_password",
        "jane@example.com"
      )
    );
    expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
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
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(mockVerifyOtp).toHaveBeenCalledWith("+919876543210", "123456")
    );
  });

  it("continues into the app even if recording the method fails (best-effort)", async () => {
    // updateUser succeeds (password reset, session live), but recording the auth
    // method rejects — the user must not be stranded with a misleading error.
    mockRecordAuthSuccess.mockRejectedValueOnce(new Error("network down"));

    render(<ForgotPasswordPage />);

    fireEvent.change(screen.getByLabelText(/phone or email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send otp/i }));

    fireEvent.change(await screen.findByLabelText(/otp/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(mockVerifyEmailOtp).toHaveBeenCalledWith("jane@example.com", "123456")
    );

    fireEvent.change(await screen.findByLabelText(/new password/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(VALID_PASSWORD));
    // Recording threw, yet the reset completes — navigate to /home with no error.
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true })
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
