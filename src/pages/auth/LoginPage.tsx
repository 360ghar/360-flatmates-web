import { useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";

import { useAuth } from "@/hooks/useAuth";
import { useWebOtp } from "@/hooks/useWebOtp";
import { useResendTimer } from "@/hooks/useResendTimer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { ResendOtp } from "@/components/ui/ResendOtp";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { OrDivider } from "@/components/ui/OrDivider";
import { detectIdentifierChannel } from "@/lib/api/auth";
import { authStore } from "@/lib/stores/auth-store";
import { getLastAuthMethod, maskIdentifier } from "@/lib/lastAuthMethod";
import { PASSWORD_REGEX } from "@/lib/schemas/common";

/**
 * Login state-machine:
 *   identifier  → POST /auth/identifier-status →
 *     next_step === "password"  ⇒  password step (account already has a password)
 *     next_step === "otp"       ⇒  OTP step → verify code →
 *        has_password === false ⇒  MANDATORY, non-skippable set-password step
 *                                  before login completes
 *        has_password === true  ⇒  login completes immediately after OTP
 *
 * The set-password gate fires whenever `has_password === false` from
 * `/auth/identifier-status` (an unknown identifier is treated as no password).
 * It is NOT applied to the Google redirect path (handled in AuthCallbackPage),
 * which is passwordless by design.
 *
 * Supports both email and phone identifiers (auto-detected). This page is the
 * reference template for the other web apps.
 */
type LoginStep = "identifier" | "password" | "otp" | "set-password";

const COUNTRY_CODE = "+91";

/** Normalize a raw phone (digits, possibly with +91) to E.164 `+91XXXXXXXXXX`. */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^91/, "").slice(-10);
  return `${COUNTRY_CODE}${digits}`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const {
    checkIdentifierStatus,
    signInWithPassword,
    signInWithEmailPassword,
    signInWithPhone,
    signInWithEmailOtp,
    verifyOtp,
    verifyEmailOtp,
    updateUser,
    signInWithGoogle,
    signInWithApple,
    recordAuthSuccess,
  } = useAuth();

  const [step, setStep] = useState<LoginStep>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  /**
   * True when the account has no password (`has_password === false`). After OTP
   * verification this forces a mandatory, non-skippable set-password step.
   */
  const [mustSetPassword, setMustSetPassword] = useState(false);
  /**
   * Whether the OTP send was allowed to create an account (only for an unknown
   * identifier). Tracked so resend reuses the same create-vs-login decision.
   */
  const [otpAllowsCreate, setOtpAllowsCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  /** Apple Sign-In is only available on iOS/Safari browsers. */
  const isAppleSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    const supportsTouchCallout =
      typeof CSS !== "undefined" && typeof CSS.supports === "function"
        ? CSS.supports("-webkit-touch-callout", "none")
        : false;
    return (
      supportsTouchCallout ||
      /iPhone|iPad|iPod|Safari/i.test(navigator.userAgent)
    );
  }, []);

  const resendTimer = useResendTimer(30);

  const channel = useMemo(
    () => detectIdentifierChannel(identifier),
    [identifier]
  );

  const lastMethod = useMemo(() => getLastAuthMethod(), []);

  // SMS OTP autofill (Android Chrome) — only while awaiting a phone OTP.
  useWebOtp(step === "otp" && channel === "phone", setOtp);

  // OTP verification creates a session before the flow is finished (the
  // mandatory set-password step may still follow). Hold AuthRedirectGuard
  // while on those steps so it cannot bounce the user to /home mid-flow.
  useEffect(() => {
    authStore.getState().setMidAuthFlow(step === "otp" || step === "set-password");
    return () => authStore.getState().setMidAuthFlow(false);
  }, [step]);

  const resolvedIdentifier = useMemo(
    () => (channel === "phone" ? normalizePhone(identifier) : identifier.trim()),
    [channel, identifier]
  );

  const handleGoogleLogin = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // The masked hint + last-method bookkeeping happens after the redirect
      // completes (AuthCallbackPage); here we only kick off the OAuth redirect.
      await signInWithGoogle();
    } catch (err: unknown) {
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    }
  }, [signInWithGoogle]);

  const handleAppleLogin = useCallback(async () => {
    setError(null);
    setAppleLoading(true);
    try {
      await signInWithApple();
    } catch (err: unknown) {
      setAppleLoading(false);
      setError(err instanceof Error ? err.message : "Apple sign-in failed. Please try again.");
    }
  }, [signInWithApple]);

  const handleContinue = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      const status = await checkIdentifierStatus(resolvedIdentifier);
      if (status.next_step === "password") {
        setStep("password");
      } else {
        // OTP-first. Allow account creation when the identifier is unknown
        // (login form doubles as signup for unknown identifiers) or the account
        // is still unverified — some GoTrue versions reject a login-only OTP
        // for unconfirmed accounts ("Signups not allowed for otp"). An existing
        // account is never duplicated by shouldCreateUser=true.
        const allowCreate = !status.exists || !status.verified;
        if (channel === "phone") {
          await signInWithPhone(resolvedIdentifier, allowCreate);
        } else {
          await signInWithEmailOtp(resolvedIdentifier, allowCreate);
        }
        setOtpAllowsCreate(allowCreate);
        // Any account without a password (`has_password === false`, incl.
        // unknown identifiers) must set one after OTP — see `set-password` step.
        setMustSetPassword(status.has_password === false);
        setStep("otp");
        resendTimer.start();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    checkIdentifierStatus,
    resolvedIdentifier,
    channel,
    signInWithPhone,
    signInWithEmailOtp,
    resendTimer,
  ]);

  const handleResendOtp = useCallback(async () => {
    setError(null);
    setResending(true);
    try {
      // Preserve the create-vs-login decision made on the initial send.
      if (channel === "phone") {
        await signInWithPhone(resolvedIdentifier, otpAllowsCreate);
      } else {
        await signInWithEmailOtp(resolvedIdentifier, otpAllowsCreate);
      }
      resendTimer.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }, [channel, signInWithPhone, signInWithEmailOtp, resolvedIdentifier, otpAllowsCreate, resendTimer]);

  const handlePasswordLogin = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (channel === "phone") {
        await signInWithPassword(resolvedIdentifier, password);
        await recordAuthSuccess("phone_password", resolvedIdentifier);
      } else {
        await signInWithEmailPassword(resolvedIdentifier, password);
        await recordAuthSuccess("email_password", resolvedIdentifier);
      }
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    channel,
    signInWithPassword,
    signInWithEmailPassword,
    resolvedIdentifier,
    password,
    recordAuthSuccess,
    navigate,
  ]);

  const handleVerifyOtp = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (channel === "phone") {
        await verifyOtp(resolvedIdentifier, otp);
      } else {
        await verifyEmailOtp(resolvedIdentifier, otp);
      }

      // Account has no password ⇒ force the mandatory set-password step before
      // completing login. Do NOT record the OTP method yet — login is not done
      // until a password is set.
      if (mustSetPassword) {
        setStep("set-password");
        return;
      }

      await recordAuthSuccess(
        channel === "phone" ? "phone_otp" : "email_otp",
        resolvedIdentifier
      );
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    mustSetPassword,
    channel,
    verifyOtp,
    verifyEmailOtp,
    resolvedIdentifier,
    otp,
    recordAuthSuccess,
    navigate,
  ]);

  // Mandatory, non-skippable: the session already exists (OTP verified), but
  // login does not complete until a valid password is set on the account.
  const handleSetPassword = useCallback(async () => {
    setError(null);
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
      await updateUser(password);
      // Now the account is password-backed → record the password method.
      await recordAuthSuccess(
        channel === "phone" ? "phone_password" : "email_password",
        resolvedIdentifier
      );
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to set password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [
    password,
    confirmPassword,
    channel,
    updateUser,
    recordAuthSuccess,
    resolvedIdentifier,
    navigate,
  ]);

  const goBackToIdentifier = useCallback(() => {
    setStep("identifier");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setMustSetPassword(false);
    setError(null);
  }, []);

  // Editing the identifier after branching returns to the identifier step so a
  // stale password/OTP form is never submitted against a different identifier.
  const handleIdentifierChange = useCallback(
    (value: string) => {
      setIdentifier(value);
      if (step !== "identifier") {
        setStep("identifier");
        setMustSetPassword(false);
      }
    },
    [step]
  );

  return (
    <>
      <SeoHelmet title="Sign In or Sign Up" description="Sign in to your 360 Flatmates account — or create one — to access compatible flatmate matches, verified listings, and in-app chat." canonicalUrl={`${SITE_URL}/login`} noindex />
      <h1 className="text-display text-3xl md:text-4xl text-ink font-normal tracking-tight">Sign in or sign up</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Enter your email or phone to find your <span className="text-serif-italic text-accent italic font-normal text-[18px]">vibe match</span> — we&apos;ll create an account if you&apos;re new.
      </p>

      {lastMethod && step === "identifier" && (
        <p className="mt-3 text-caption text-ink-3" data-testid="last-method-hint">
          Last time you used{" "}
          <span className="font-semibold text-accent">{describeMethod(lastMethod.method)}</span>
          {lastMethod.identifierHint ? ` (${lastMethod.identifierHint})` : ""}.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-error-soft p-3 text-caption text-error" role="alert">
          {error}
        </div>
      )}

      <Button
        fullWidth
        variant="google"
        className="mt-5"
        aria-label="Continue with Google"
        data-method-highlight={lastMethod?.method === "google" ? "true" : undefined}
        loading={googleLoading}
        onClick={handleGoogleLogin}
      >
        <span className="flex items-center justify-center gap-2">
          <GoogleIcon className="h-4 w-4" />
          Continue with Google
        </span>
      </Button>

      {isAppleSupported && (
        <Button
          fullWidth
          variant="secondary"
          className="mt-3 bg-black text-white hover:bg-black/90"
          aria-label="Continue with Apple"
          data-method-highlight={lastMethod?.method === "apple" ? "true" : undefined}
          loading={appleLoading}
          onClick={handleAppleLogin}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 12.04c-.03-3.18 2.6-4.71 2.72-4.78-1.49-2.18-3.81-2.47-4.62-2.51-1.97-.2-3.84 1.16-4.84 1.16-1 0-2.54-1.13-4.18-1.1-2.15.03-4.13 1.25-5.24 3.18-2.23 3.87-.57 9.6 1.61 12.74 1.06 1.54 2.33 3.28 4 3.22 1.61-.07 2.22-1.04 4.16-1.04 1.94 0 2.49 1.04 4.18 1.01 1.73-.03 2.82-1.57 3.88-3.12 1.22-1.79 1.73-3.52 1.75-3.61-.04-.02-3.36-1.29-3.39-5.11zM14.06 3.42c.89-1.08 1.49-2.58 1.33-4.08-1.28.05-2.84.85-3.76 1.93-.83.96-1.55 2.49-1.36 3.96 1.43.11 2.9-.72 3.79-1.81z"/>
            </svg>
            Continue with Apple
          </span>
        </Button>
      )}

      <OrDivider className="my-5" />

      {/* Step 1 — identifier */}
      <Input
        label="Email or phone"
        type={channel === "phone" ? "tel" : "text"}
        inputMode={channel === "phone" ? "tel" : undefined}
        autoComplete="username"
        placeholder="you@example.com or 98765 43210"
        value={identifier}
        onChange={(e) => handleIdentifierChange(e.target.value)}
        autoFocus
      />

      {step === "identifier" && (
        <Button
          fullWidth
          className="mt-4"
          loading={submitting}
          disabled={identifier.trim().length < 3}
          onClick={handleContinue}
        >
          Continue
        </Button>
      )}

      {/* Step 2a — password */}
      {step === "password" && (
        <>
          <PasswordInput
            label="Password"
            placeholder="Enter password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-4"
            autoFocus
          />
          <div className="mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-label-md text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" onClick={goBackToIdentifier}>
              Back
            </Button>
            <Button
              fullWidth
              loading={submitting}
              disabled={!password}
              onClick={handlePasswordLogin}
            >
              Sign in
            </Button>
          </div>
        </>
      )}

      {/* Step 2b — OTP verification */}
      {step === "otp" && (() => {
        const expectedOtpLength = 6;
        return (
          <>
            <Input
              label="Verification code"
              placeholder={`${expectedOtpLength}-digit code`}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={expectedOtpLength}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, expectedOtpLength))}
              className="mt-4"
              autoFocus
              helperText={`Sent to ${channel === "phone" ? resolvedIdentifier : identifier.trim()}`}
            />
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" onClick={goBackToIdentifier}>
                Back
              </Button>
              <Button
                className="flex-1"
                loading={submitting}
                disabled={otp.length < expectedOtpLength}
                onClick={handleVerifyOtp}
              >
                {mustSetPassword ? "Verify & continue" : "Verify"}
              </Button>
            </div>
            <ResendOtp timer={resendTimer} onResend={handleResendOtp} loading={resending} />
          </>
        );
      })()}

      {/* Step 2c — mandatory set-password (non-skippable, no back/skip).
          Reached only after a successful OTP verification on a passwordless
          account. The session already exists, so login completes only once a
          valid password is set. */}
      {step === "set-password" && (
        <>
          <p className="mt-2 text-body-md text-ink-2">
            Set a password to secure your account and finish signing in.
          </p>
          <p className="mt-1 text-caption text-ink-3">
            For <span className="font-semibold text-ink-2">{maskIdentifier(resolvedIdentifier)}</span>
          </p>
          <PasswordInput
            label="Create password"
            placeholder="Min 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-4"
            autoFocus
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-4"
          />
          <div className="mt-3 rounded-xl bg-paper-2 p-3 text-caption text-ink-2">
            Min 8 chars, 1 uppercase, 1 number, 1 special character.
          </div>
          <Button
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={!password || !confirmPassword}
            onClick={handleSetPassword}
          >
            Set password &amp; continue
          </Button>
        </>
      )}

      <p className="mt-6 text-center text-caption text-ink-3">
        By continuing, you agree to our{" "}
        <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}

function describeMethod(method: string): string {
  switch (method) {
    case "google":
      return "Google";
    case "apple":
      return "Apple";
    case "email_password":
      return "email & password";
    case "phone_password":
      return "phone & password";
    case "phone_otp":
      return "a phone code";
    case "email_otp":
      return "an email code";
    default:
      return method;
  }
}
