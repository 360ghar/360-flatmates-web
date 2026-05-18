import { useState, useCallback } from "react";
import { Link } from "react-router";
import { useNavigate } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { PhoneInput, formatFullPhone } from "@/components/ui/PhoneInput";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { OrDivider } from "@/components/ui/OrDivider";

export function LoginPage() {
  const navigate = useNavigate();
  const { signInWithPassword, signInWithGoogle } = useAuth();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setGoogleLoading(false);
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    }
  }, [signInWithGoogle]);

  const handlePasswordLogin = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPassword(formatFullPhone(phone), password);
      navigate("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid credentials. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [signInWithPassword, phone, password, navigate]);

  return (
    <>
      <h1 className="text-h1">Sign in</h1>
      <p className="mt-2 text-body-md text-ink-2">
        Enter your phone number and password to continue.
      </p>

      {error && (
        <div className="mt-4 rounded-xl bg-error-soft p-3 text-caption text-error" role="alert">
          {error}
        </div>
      )}

      <Button
        fullWidth
        variant="secondary"
        className="mt-5"
        aria-label="Continue with Google"
        loading={googleLoading}
        onClick={handleGoogleLogin}
      >
        <span className="flex items-center justify-center gap-2">
          <GoogleIcon className="h-4 w-4" />
          Continue with Google
        </span>
      </Button>

      <OrDivider className="my-5" />

      <PhoneInput
        label="Phone number"
        value={phone}
        onChange={setPhone}
        autoFocus
      />
      <PasswordInput
        label="Password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-4"
      />
      <div className="mt-2 flex justify-end">
        <Link
          to="/forgot-password"
          className="text-label-md text-accent hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <Button
        fullWidth
        className="mt-4"
        loading={submitting}
        disabled={phone.length < 10 || !password}
        onClick={handlePasswordLogin}
      >
        Sign in
      </Button>

      <p className="mt-6 text-center text-body-md text-ink-2">
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
