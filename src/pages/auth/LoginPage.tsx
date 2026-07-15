import { Link } from "react-router";
import { SeoHelmet, SITE_URL } from "@/lib/seo";
import { LoginSocialButtons } from "./LoginSocialButtons";
import { LoginIdentifierField } from "./LoginIdentifierField";
import { LoginPasswordStep } from "./LoginPasswordStep";
import { LoginOtpStep } from "./LoginOtpStep";
import { LoginSetPasswordStep } from "./LoginSetPasswordStep";
import { useLoginPageForm } from "./useLoginPageForm";

export function LoginPage() {
  const {
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
  } = useLoginPageForm();

  return (
    <>
      <SeoHelmet title="Sign In or Sign Up" description="Sign in to your 360 Flatmates account (or create one) to access compatible flatmate matches, verified listings, and in-app chat." canonicalUrl={`${SITE_URL}/login`} noindex />
      <h1 className="text-display text-3xl md:text-4xl text-ink tracking-tight">Sign in or sign up</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Enter your email or phone to find your <span className="text-serif-italic text-accent italic font-normal text-[18px]">vibe match</span>. We&apos;ll create an account if you&apos;re new.
      </p>

      {lastMethod && loginForm.step === "identifier" && (
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

      <LoginSocialButtons
        redirectTo={redirectTo}
        highlightedMethod={lastMethod?.method}
        onError={setError}
      />

      {/* Step 1 — identifier */}
      <LoginIdentifierField
        step={loginForm.step}
        identifier={loginForm.identifier}
        channel={channel}
        submitting={submitting}
        onIdentifierChange={handleIdentifierChange}
        onSubmit={handleContinue}
      />

      {/* Step 2a — password */}
      {loginForm.step === "password" && (
        <LoginPasswordStep
          password={loginForm.password}
          submitting={submitting}
          onPasswordChange={(value) => dispatchLoginForm({ type: "setPassword", value })}
          onBack={goBackToIdentifier}
          onSubmit={handlePasswordLogin}
        />
      )}

      {/* Step 2b — OTP verification */}
      {loginForm.step === "otp" && (
        <LoginOtpStep
          otp={loginForm.otp}
          mustSetPassword={loginForm.mustSetPassword}
          channel={channel}
          resolvedIdentifier={resolvedIdentifier}
          identifier={loginForm.identifier}
          submitting={submitting}
          resendTimer={resendTimer}
          resending={resending}
          onOtpChange={setOtp}
          onBack={goBackToIdentifier}
          onSubmit={handleVerifyOtp}
          onResend={handleResendOtp}
        />
      )}

      {/* Step 2c — mandatory set-password. The session already exists
          (OTP verified or backend-gated), so login completes only once a
          valid password is set. */}
      {loginForm.step === "set-password" && (
        <LoginSetPasswordStep
          password={loginForm.password}
          confirmPassword={loginForm.confirmPassword}
          resolvedIdentifier={resolvedIdentifier}
          submitting={submitting}
          onPasswordChange={(value) => dispatchLoginForm({ type: "setPassword", value })}
          onConfirmPasswordChange={(value) => dispatchLoginForm({ type: "setConfirmPassword", value })}
          onSubmit={handleSetPassword}
          onUseDifferentIdentifier={handleUseDifferentIdentifier}
        />
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
