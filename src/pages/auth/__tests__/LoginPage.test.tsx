import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@/test-utils";
import { waitFor } from "@testing-library/react";

// --- Mocks -----------------------------------------------------------------

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// SeoHelmet needs a HelmetProvider; stub it out for this state-machine test.
vi.mock("@/lib/seo", () => ({
  SeoHelmet: () => null,
  SITE_URL: "https://test.local",
}));

// WebOTP is a browser-only side effect — no-op in tests.
vi.mock("@/hooks/useWebOtp", () => ({ useWebOtp: () => {} }));

vi.mock("@/lib/lastAuthMethod", () => ({
  getLastAuthMethod: () => null,
  maskIdentifier: (v: string) => v,
}));

const mockCheckIdentifierStatus = vi.fn();
const mockSignInWithPhone = vi.fn();
const mockSignInWithEmailOtp = vi.fn();
const mockVerifyOtp = vi.fn();
const mockVerifyEmailOtp = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithEmailPassword = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockSignInWithApple = vi.fn();
const mockRecordAuthSuccess = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    checkIdentifierStatus: mockCheckIdentifierStatus,
    signInWithPhone: mockSignInWithPhone,
    signInWithEmailOtp: mockSignInWithEmailOtp,
    verifyOtp: mockVerifyOtp,
    verifyEmailOtp: mockVerifyEmailOtp,
    updateUser: mockUpdateUser,
    signInWithPassword: mockSignInWithPassword,
    signInWithEmailPassword: mockSignInWithEmailPassword,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithApple: mockSignInWithApple,
    recordAuthSuccess: mockRecordAuthSuccess,
  }),
}));

import { LoginPage } from "@/pages/auth/LoginPage";

const VALID_PASSWORD = "Password1!";

function typeIdentifierAndContinue(value: string) {
  fireEvent.change(screen.getByLabelText(/email or phone/i), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));
}

describe("LoginPage — OAuth redirects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithGoogle.mockResolvedValue(undefined);
  });

  it("starts Google sign-in with the sanitized default app redirect", async () => {
    render(<LoginPage />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => expect(mockSignInWithGoogle).toHaveBeenCalledWith("/home"));
  });
});

describe("LoginPage — set-password after OTP (requirement 6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyOtp.mockResolvedValue(undefined);
    mockVerifyEmailOtp.mockResolvedValue(undefined);
    mockSignInWithPhone.mockResolvedValue(undefined);
    mockSignInWithEmailOtp.mockResolvedValue(undefined);
    mockUpdateUser.mockResolvedValue(undefined);
    mockRecordAuthSuccess.mockResolvedValue(undefined);
  });

  it("forces a non-skippable set-password step when has_password === false (phone)", async () => {
    mockCheckIdentifierStatus.mockResolvedValue({
      exists: true,
      verified: false,
      has_password: false,
      channel: "phone",
      next_step: "otp",
    });

    render(<LoginPage />);
    typeIdentifierAndContinue("9876543210");

    // OTP step
    const otp = await screen.findByLabelText(/verification code/i);
    fireEvent.change(otp, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify & continue/i }));

    // OTP verified, but login must NOT complete yet — set-password is forced.
    await waitFor(() => expect(mockVerifyOtp).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockRecordAuthSuccess).not.toHaveBeenCalled();

    // The mandatory set-password step is shown with no skip/back affordance.
    expect(await screen.findByLabelText(/create password/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /skip/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^back$/i })).not.toBeInTheDocument();

    // Setting a valid password completes login and records phone_password.
    fireEvent.change(screen.getByLabelText(/create password/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: /set password & continue/i }));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(VALID_PASSWORD));
    expect(mockRecordAuthSuccess).toHaveBeenCalledWith(
      "phone_password",
      "+919876543210"
    );
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  it("forces set-password for an unknown identifier (has_password === false, email)", async () => {
    mockCheckIdentifierStatus.mockResolvedValue({
      exists: false,
      verified: false,
      has_password: false,
      channel: "email",
      next_step: "otp",
    });

    render(<LoginPage />);
    typeIdentifierAndContinue("new@example.com");

    const otp = await screen.findByLabelText(/verification code/i);
    fireEvent.change(otp, { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: /verify & continue/i }));

    await waitFor(() => expect(mockVerifyEmailOtp).toHaveBeenCalled());
    expect(await screen.findByLabelText(/create password/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does NOT force set-password when has_password === true (OTP login completes)", async () => {
    mockCheckIdentifierStatus.mockResolvedValue({
      exists: true,
      verified: true,
      has_password: true,
      // Forced OTP path while still password-backed (verified existing user).
      channel: "phone",
      next_step: "otp",
    });

    render(<LoginPage />);
    typeIdentifierAndContinue("9876543210");

    const otp = await screen.findByLabelText(/verification code/i);
    fireEvent.change(otp, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() =>
      expect(mockRecordAuthSuccess).toHaveBeenCalledWith("phone_otp", "+919876543210")
    );
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(screen.queryByLabelText(/create password/i)).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith("/home");
  });

  it("rejects a weak password on the set-password step and keeps the gate", async () => {
    mockCheckIdentifierStatus.mockResolvedValue({
      exists: true,
      verified: false,
      has_password: false,
      channel: "phone",
      next_step: "otp",
    });

    render(<LoginPage />);
    typeIdentifierAndContinue("9876543210");

    fireEvent.change(await screen.findByLabelText(/verification code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify & continue/i }));

    await screen.findByLabelText(/create password/i);
    fireEvent.change(screen.getByLabelText(/create password/i), {
      target: { value: "weak" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "weak" },
    });
    fireEvent.click(screen.getByRole("button", { name: /set password & continue/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe("LoginPage — recording the auth method is best-effort", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockVerifyOtp.mockResolvedValue(undefined);
    mockVerifyEmailOtp.mockResolvedValue(undefined);
    mockSignInWithPhone.mockResolvedValue(undefined);
    mockSignInWithPassword.mockResolvedValue(undefined);
    mockUpdateUser.mockResolvedValue(undefined);
    // Recording the method fails on every flow — the must-not-strand path.
    mockRecordAuthSuccess.mockRejectedValue(new Error("network down"));
  });

  it("completes password login even when recording fails", async () => {
    mockCheckIdentifierStatus.mockResolvedValue({
      exists: true,
      verified: true,
      has_password: true,
      channel: "phone",
      next_step: "password",
    });

    render(<LoginPage />);
    typeIdentifierAndContinue("9876543210");

    fireEvent.change(await screen.findByLabelText(/^password$/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(mockSignInWithPassword).toHaveBeenCalledWith("+919876543210", VALID_PASSWORD)
    );
    // Recording threw, yet login completes — navigate to /home with no error.
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/home"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("completes OTP login even when recording fails (password-backed account)", async () => {
    mockCheckIdentifierStatus.mockResolvedValue({
      exists: true,
      verified: true,
      has_password: true,
      channel: "phone",
      next_step: "otp",
    });

    render(<LoginPage />);
    typeIdentifierAndContinue("9876543210");

    fireEvent.change(await screen.findByLabelText(/verification code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() => expect(mockVerifyOtp).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/home"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("completes the mandatory set-password step even when recording fails", async () => {
    mockCheckIdentifierStatus.mockResolvedValue({
      exists: true,
      verified: false,
      has_password: false,
      channel: "phone",
      next_step: "otp",
    });

    render(<LoginPage />);
    typeIdentifierAndContinue("9876543210");

    fireEvent.change(await screen.findByLabelText(/verification code/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify & continue/i }));

    fireEvent.change(await screen.findByLabelText(/create password/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: VALID_PASSWORD },
    });
    fireEvent.click(screen.getByRole("button", { name: /set password & continue/i }));

    await waitFor(() => expect(mockUpdateUser).toHaveBeenCalledWith(VALID_PASSWORD));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/home"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
