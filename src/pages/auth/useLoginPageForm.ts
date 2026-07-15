import { useState, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useWebOtp } from "@/hooks/useWebOtp";
import { useResendTimer } from "@/hooks/useResendTimer";
import { detectIdentifierChannel } from "@/lib/api/auth";
import { authStore } from "@/lib/stores/auth-store";
import { getLastAuthMethod } from "@/lib/lastAuthMethod";
import { PASSWORD_REGEX } from "@/lib/schemas/common";
import { resolveRedirect, normalizePhone } from "@/lib/redirect";
import { PASSWORD_POLICY_ERROR_TEXT } from "./_password-policy";
import { loginFormReducer, initLoginFormState } from "./_login-form-reducer";
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

export function useLoginPageForm() {
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
    signOut,
    recordAuthSuccess,
  } = useAuth();

  const passwordSetupFlow = searchParams.get("flow") === "set-password";
  // Core login-flow state — step/identifier/password/confirmPassword/otp/
  // mustSetPassword all transition together at the same call sites (see
  // goBackToIdentifier, handleUseDifferentIdentifier, handleIdentifierChange),
  // so they live in one reducer instead of six separate useStates.
  const [loginForm, dispatchLoginForm] = useReducer(
    loginFormReducer,
    passwordSetupFlow,
    initLoginFormState
  );
  /**
   * Whether the OTP send was allowed to create an account (only for an unknown
   * identifier). Tracked so resend reuses the same create-vs-login decision.
   * Never rendered on screen, so a ref avoids a wasted re-render per update.
   */
  const otpAllowsCreateRef = useRef(false);
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

  const resendTimer = useResendTimer(30);

  // Honor the deep-link target captured by AuthGuard (`/login?redirect=...`);
  // default to /home for a plain sign-in.
  const redirectTo = useMemo(
    () => resolveRedirect(searchParams.get("redirect")),
    [searchParams]
  );

  const channel = useMemo(
    () => detectIdentifierChannel(loginForm.identifier),
    [loginForm.identifier]
  );

  const lastMethod = useMemo(() => getLastAuthMethod(), []);

  // SMS OTP autofill (Android Chrome) — only while awaiting a phone OTP.
  const setOtp = useCallback((value: string) => dispatchLoginForm({ type: "setOtp", value }), []);
  useWebOtp(loginForm.step === "otp" && channel === "phone", setOtp);

  // OTP verification creates a session before the flow is finished (the
  // mandatory set-password step may still follow). Hold AuthRedirectGuard
  // while on those steps so it cannot bounce the user to /home mid-flow.
  useEffect(() => {
    authStore.getState().setMidAuthFlow(loginForm.step === "otp" || loginForm.step === "set-password");
    return () => authStore.getState().setMidAuthFlow(false);
  }, [loginForm.step]);

  const resolvedIdentifier = useMemo(
    () => (channel === "phone" ? normalizePhone(loginForm.identifier) : loginForm.identifier.trim()),
    [channel, loginForm.identifier]
  );

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
        dispatchLoginForm({ type: "setStep", step: "password" });
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
        otpAllowsCreateRef.current = allowCreate;
        // Any account without a password (`has_password === false`, incl.
        // unknown identifiers) must set one after OTP — see `set-password` step.
        dispatchLoginForm({ type: "advanceToOtp", mustSetPassword: status.has_password === false });
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
        await signInWithPhone(resolvedIdentifier, otpAllowsCreateRef.current);
      } else {
        await signInWithEmailOtp(resolvedIdentifier, otpAllowsCreateRef.current);
      }
      resendTimer.start();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }, [channel, signInWithPhone, signInWithEmailOtp, resolvedIdentifier, resendTimer]);

  const handlePasswordLogin = useCallback(async () => {
    setError(null);
    setSubmitting(true);

    // Core operation — must succeed. On success the session is live.
    try {
      if (channel === "phone") {
        await signInWithPassword(resolvedIdentifier, loginForm.password);
      } else {
        await signInWithEmailPassword(resolvedIdentifier, loginForm.password);
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
    loginForm.password,
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
        await verifyOtp(resolvedIdentifier, loginForm.otp);
      } else {
        await verifyEmailOtp(resolvedIdentifier, loginForm.otp);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to verify. Please try again.");
      setSubmitting(false);
      return;
    }

    // Account has no password ⇒ force the mandatory set-password step before
    // completing login. Do NOT record the OTP method yet — login is not done
    // until a password is set.
    if (loginForm.mustSetPassword) {
      dispatchLoginForm({ type: "setStep", step: "set-password" });
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
    loginForm.mustSetPassword,
    channel,
    verifyOtp,
    verifyEmailOtp,
    resolvedIdentifier,
    loginForm.otp,
    recordAuthSuccess,
    navigate,
    redirectTo,
  ]);

  // Mandatory, non-skippable: the session already exists (OTP verified), but
  // login does not complete until a valid password is set on the account.
  const handleSetPassword = useCallback(async () => {
    setError(null);
    if (!PASSWORD_REGEX.test(loginForm.password)) {
      setError(PASSWORD_POLICY_ERROR_TEXT);
      return;
    }
    if (loginForm.password !== loginForm.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    // Core operation — must succeed. The session already exists (OTP verified);
    // on success the account is password-backed.
    try {
      await updateUser(loginForm.password);
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
    loginForm.password,
    loginForm.confirmPassword,
    channel,
    updateUser,
    recordAuthSuccess,
    resolvedIdentifier,
    navigate,
    redirectTo,
  ]);

  const goBackToIdentifier = useCallback(() => {
    dispatchLoginForm({ type: "resetToIdentifier" });
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
      dispatchLoginForm({ type: "fullReset" });
      const next = new URLSearchParams(searchParams);
      next.delete("flow");
      next.delete("identifier");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, signOut]);

  // Editing the identifier after branching returns to the identifier step so a
  // stale password/OTP form is never submitted against a different identifier
  // (handled by the "changeIdentifier" reducer action).
  const handleIdentifierChange = useCallback((value: string) => {
    dispatchLoginForm({ type: "changeIdentifier", value });
    setError(null);
  }, []);

  return {
    loginForm,
    dispatchLoginForm,
    error,
    setError,
    submitting,
    resending,
    resendTimer,
    redirectTo,
    channel,
    lastMethod,
    resolvedIdentifier,
    setOtp,
    handleContinue,
    handleResendOtp,
    handlePasswordLogin,
    handleVerifyOtp,
    handleSetPassword,
    goBackToIdentifier,
    handleUseDifferentIdentifier,
    handleIdentifierChange,
  };
}
