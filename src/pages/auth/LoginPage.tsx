import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router";
import { useNavigate, useSearchParams } from "react-router";
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
import { resolveRedirect, normalizePhone } from "@/lib/redirect";
import { PASSWORD_POLICY_HELPER_TEXT, PASSWORD_POLICY_ERROR_TEXT } from "./_password-policy";
import {
  UNVERIFIED_ACCOUNT_MESSAGE,
  IDENTIFIER_STATUS_UNAVAILABLE_MESSAGE,
} from "@/lib/authErrors";

/**
 * Lightweight format gate so a malformed identifier never reaches the
 * `/auth/identifier-status` endpoint (which would 422 and force a generic
 * error). A pragmatic RFC-5322 subset is enough to catch typos like `"abc"`
 * — which `detectIdentifierChannel` currently classifies as "email" — and
 * to reject phone numbers that are clearly too short. Phone length is
 * checked against the digit count (≥ 10) to accept our `+91` default as
 * well as the raw 10-digit form.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
    signOut,
    recordAuthSuccess,
  } = useAuth();

  const passwordSetupFlow = searchParams.get("flow") === "set-password";
  const [step, setStep] = useState<LoginStep>(() =>
    passwordSetupFlow ? "set-password" : "identifier"
  );
  // Seed the identifier from the URL on first render so a hard refresh during
  // the OTP step doesn't leave the user staring at an empty input. The
  // `?identifier=...` query param is set on `setStep("otp")` and cleared on
  // `goBackToIdentifier`.
  const [identifier, setIdentifier] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("identifier") ?? "";
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  /**
   * True when the account has no password (`has_password === false`). After OTP
   * verification this forces a mandatory, non-skippable set-password step.
   */
  const [mustSetPassword, setMustSetPassword] = useState(passwordSetupFlow);
  /**
   * Whether the OTP send was allowed to create an account (only for an unknown
   * identifier). Tracked so resend reuses the same create-vs-login decision.
   */
  const [otpAllowsCreate, setOtpAllowsCreate] = useState(false);
  // Surface the OAuth-callback failure (`/login?error=auth`) inline on first render.
  const [error, setError] = useState<string | null>(() => {
    const param = searchParams.get("error");
    if (!param) return null;
    if (param === "auth") {
      return "We couldn't complete that sign-in. Please try again.";
    }
    return param;
  });
  // Clear the `?error=` query param on first render so a refresh doesn't
  // re-surface the same toast and a copy/paste of the URL doesn't carry the
  // error state forward.
  useEffect(() => {
    if (searchParams.get("error")) {
      const next = new URLSearchParams(searchParams);
      next.delete("error");
      setSearchParams(next, { replace: true });
    }
    // Run only on first mount — re-running on every param change would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track the in-flight identifier-status request so a stale response can't
  // mutate state if the user re-submits the identifier step mid-flight.
  const statusAbortRef = useRef<AbortController | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  /** Apple Sign-In is only available on iOS/Safari browsers. */
  const isAppleSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    // The WebKit-only `-webkit-touch-callout` CSS prop is the real gate — every
    // iOS Safari version supports it, and no desktop browser does.
    const supportsTouchCallout =
      typeof CSS !== "undefined" && typeof CSS.supports === "function"
        ? CSS.supports("-webkit-touch-callout", "none")
        : false;
    if (supportsTouchCallout) return true;

    // Fallback UA sniff: only treat as Apple when the UA *also* contains
    // "Mobile" or "Mac" (desktop Safari shares the engine but a separate
    // product, and we don't ship Apple Sign-In there). Crucially, exclude
    // Chrome / Edge / Opera on iOS — they all masquerade as "Safari" in the UA
    // but are not the platform owner.
    const ua = navigator.userAgent;
    const isAppleDevice = /iPhone|iPad|iPod/.test(ua);
    const isMacSafari =
      /Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
    return isAppleDevice || isMacSafari;
  }, []);

  const resendTimer = useResendTimer(30);

  // Honor the deep-link target captured by AuthGuard (`/login?redirect=...`);
  // default to /home for a plain sign-in.
  const redirectTo = useMemo(
    () => resolveRedirect(searchParams.get("redirect")),
    [searchParams]
  );

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
      await signInWithGoogle(redirectTo);
    } catch (err: unknown) {
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    }
  }, [redirectTo, signInWithGoogle]);

  const handleAppleLogin = useCallback(async () => {
    setError(null);
    setAppleLoading(true);
    try {
      await signInWithApple(redirectTo);
    } catch (err: unknown) {
      setAppleLoading(false);
      setError(err instanceof Error ? err.message : "Apple sign-in failed. Please try again.");
    }
  }, [redirectTo, signInWithApple]);

  const handleContinue = useCallback(async () => {
    setError(null);

    // Format gate: never let a malformed identifier reach the backend. The
    // `detectIdentifierChannel` helper is too permissive (e.g. `"abc"` classifies
    // as email), so we validate against a stricter shape first.
    if (channel === "email" && !EMAIL_RE.test(resolvedIdentifier)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (channel === "phone") {
      const digits = resolvedIdentifier.replace(/\D/g, "");
      if (digits.length < 10) {
        setError("Please enter a valid phone number (at least 10 digits).");
        return;
      }
    }

    // Abort any in-flight identifier-status check so a stale response can't
    // mutate state after the user has already moved on.
    statusAbortRef.current?.abort();
    const controller = new AbortController();
    statusAbortRef.current = controller;

    setSubmitting(true);
    try {
      let status;
      try {
        status = await checkIdentifierStatus(resolvedIdentifier, controller.signal);
      } catch {
        if (controller.signal.aborted) return;
        // Do not proceed as signup when identifier-status is unreachable —
        // that would risk silent account creation for existing users.
        setError(IDENTIFIER_STATUS_UNAVAILABLE_MESSAGE);
        return;
      }
      if (controller.signal.aborted) return;
      if (status.next_step === "password") {
        setStep("password");
      } else {
        // OTP-first. Allow account creation when the identifier is unknown
        // (login form doubles as signup for unknown identifiers) or the account
        // is still unverified — some GoTrue versions reject a login-only OTP
        // for unconfirmed accounts ("Signups not allowed for otp"). An existing
        // account is never duplicated by shouldCreateUser=true.
        const allowCreate = !status.exists || !status.verified;
        if (status.exists && !status.verified) {
          setError(UNVERIFIED_ACCOUNT_MESSAGE);
        }
        if (channel === "phone") {
          await signInWithPhone(resolvedIdentifier, allowCreate);
        } else {
          await signInWithEmailOtp(resolvedIdentifier, allowCreate);
        }
        if (controller.signal.aborted) return;
        setOtpAllowsCreate(allowCreate);
        // Any account without a password (`has_password === false`, incl.
        // unknown identifiers) must set one after OTP — see `set-password` step.
        setMustSetPassword(status.has_password === false);
        setStep("otp");
        // Persist the identifier in the URL so a refresh mid-OTP can resume
        // the flow (the OTP itself is not persisted — the user re-sends).
        const next = new URLSearchParams(searchParams);
        next.set("identifier", resolvedIdentifier);
        setSearchParams(next, { replace: true });
        resendTimer.start();
      }
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      if (statusAbortRef.current === controller) {
        statusAbortRef.current = null;
      }
      setSubmitting(false);
    }
  }, [
    checkIdentifierStatus,
    resolvedIdentifier,
    channel,
    signInWithPhone,
    signInWithEmailOtp,
    resendTimer,
    searchParams,
    setSearchParams,
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

    // Core operation — must succeed. On success the session is live.
    try {
      if (channel === "phone") {
        await signInWithPassword(resolvedIdentifier, password);
      } else {
        await signInWithEmailPassword(resolvedIdentifier, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
      setSubmitting(false);
      return;
    }

    // Recording the auth method is best-effort: the sign-in already succeeded,
    // so a backend hiccup here must not strand the user with a misleading error.
    try {
      await recordAuthSuccess(
        channel === "phone" ? "phone_password" : "email_password",
        resolvedIdentifier
      );
    } catch {
      // Non-fatal — proceed into the app with the live session.
    }

    navigate(redirectTo);
    setSubmitting(false);
  }, [
    channel,
    signInWithPassword,
    signInWithEmailPassword,
    resolvedIdentifier,
    password,
    recordAuthSuccess,
    navigate,
    redirectTo,
  ]);

  const handleVerifyOtp = useCallback(async () => {
    setError(null);
    setSubmitting(true);

    // Core operation — must succeed. On success the session is live.
    try {
      if (channel === "phone") {
        await verifyOtp(resolvedIdentifier, otp);
      } else {
        await verifyEmailOtp(resolvedIdentifier, otp);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify. Please try again.");
      setSubmitting(false);
      return;
    }

    // Account has no password ⇒ force the mandatory set-password step before
    // completing login. Do NOT record the OTP method yet — login is not done
    // until a password is set.
    if (mustSetPassword) {
      setStep("set-password");
      setSubmitting(false);
      return;
    }

    // Recording the OTP method is best-effort: the session is already live.
    try {
      await recordAuthSuccess(
        channel === "phone" ? "phone_otp" : "email_otp",
        resolvedIdentifier
      );
    } catch {
      // Non-fatal — proceed into the app with the live session.
    }

    navigate(redirectTo);
    setSubmitting(false);
  }, [
    mustSetPassword,
    channel,
    verifyOtp,
    verifyEmailOtp,
    resolvedIdentifier,
    otp,
    recordAuthSuccess,
    navigate,
    redirectTo,
  ]);

  // Mandatory, non-skippable: the session already exists (OTP verified), but
  // login does not complete until a valid password is set on the account.
  const handleSetPassword = useCallback(async () => {
    setError(null);
    if (!PASSWORD_REGEX.test(password)) {
      setError(PASSWORD_POLICY_ERROR_TEXT);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    // Core operation — must succeed. The session already exists (OTP verified);
    // on success the account is password-backed.
    try {
      await updateUser(password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to set password. Please try again.");
      setSubmitting(false);
      return;
    }

    // Recording the password method is best-effort: the password is set and the
    // session is live, so a backend hiccup must not strand the user.
    try {
      await recordAuthSuccess(
        channel === "phone" ? "phone_password" : "email_password",
        resolvedIdentifier
      );
    } catch {
      // Non-fatal — proceed into the app with the live session.
    }

    navigate(redirectTo);
    setSubmitting(false);
  }, [
    password,
    confirmPassword,
    channel,
    updateUser,
    recordAuthSuccess,
    resolvedIdentifier,
    navigate,
    redirectTo,
  ]);

  const goBackToIdentifier = useCallback(() => {
    setStep("identifier");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setMustSetPassword(false);
    setError(null);
    // Drop the resume-helper param so the URL reflects the visible state.
    if (searchParams.get("identifier")) {
      const next = new URLSearchParams(searchParams);
      next.delete("identifier");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleUseDifferentIdentifier = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signOut();
    } catch {
      authStore.getState().resetAuthFlow();
      authStore.getState().setSession(null);
    } finally {
      setSubmitting(false);
      setIdentifier("");
      setPassword("");
      setConfirmPassword("");
      setOtp("");
      setMustSetPassword(false);
      setStep("identifier");
      const next = new URLSearchParams(searchParams);
      next.delete("flow");
      next.delete("identifier");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, signOut]);

  // Editing the identifier after branching returns to the identifier step so a
  // stale password/OTP form is never submitted against a different identifier.
  const handleIdentifierChange = useCallback(
    (value: string) => {
      setIdentifier(value);
      setError(null);
      if (step !== "identifier") {
        setStep("identifier");
        setMustSetPassword(false);
        setPassword("");
        setConfirmPassword("");
        setOtp("");
      }
    },
    [step]
  );

  return (
    <>
      <SeoHelmet title="Sign In or Sign Up" description="Sign in to your 360 Flatmates account (or create one) to access compatible flatmate matches, verified listings, and in-app chat." canonicalUrl={`${SITE_URL}/login`} noindex />
      <h1 className="text-display text-3xl md:text-4xl text-ink tracking-tight">Sign in or sign up</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Enter your email or phone to find your <span className="text-serif-italic text-accent italic font-normal text-[18px]">vibe match</span>. We&apos;ll create an account if you&apos;re new.
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleContinue();
        }}
      >
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
            type="submit"
            fullWidth
            className="mt-4"
            loading={submitting}
            disabled={identifier.trim().length < 3}
          >
            Continue
          </Button>
        )}
      </form>

      {/* Step 2a — password */}
      {step === "password" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePasswordLogin();
          }}
        >
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
            <Button type="button" variant="secondary" onClick={goBackToIdentifier}>
              Back
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={submitting}
              disabled={!password}
            >
              Sign in
            </Button>
          </div>
        </form>
      )}

      {/* Step 2b — OTP verification */}
      {step === "otp" && (() => {
        const expectedOtpLength = 6;
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyOtp();
            }}
          >
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
              <Button type="button" variant="secondary" onClick={goBackToIdentifier}>
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={submitting}
                disabled={otp.length < expectedOtpLength}
              >
                {mustSetPassword ? "Verify & continue" : "Verify"}
              </Button>
            </div>
            <ResendOtp timer={resendTimer} onResend={handleResendOtp} loading={resending} />
          </form>
        );
      })()}

      {/* Step 2c — mandatory set-password. The session already exists
          (OTP verified or backend-gated), so login completes only once a
          valid password is set. */}
      {step === "set-password" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSetPassword();
          }}
        >
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
            helperText={PASSWORD_POLICY_HELPER_TEXT}
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-4"
          />
          <Button
            type="submit"
            fullWidth
            className="mt-5"
            loading={submitting}
            disabled={!password || !confirmPassword}
          >
            Set password &amp; continue
          </Button>
          <button
            type="button"
            onClick={handleUseDifferentIdentifier}
            className="mt-3 block w-full rounded-[8px] py-2 text-center text-caption text-ink-3 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            aria-label="Use a different identifier"
          >
            Use a different identifier
          </button>
        </form>
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
