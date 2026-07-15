import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { maskIdentifier } from "@/lib/lastAuthMethod";
import { PASSWORD_POLICY_HELPER_TEXT } from "./_password-policy";

interface LoginSetPasswordStepProps {
  password: string;
  confirmPassword: string;
  resolvedIdentifier: string;
  submitting: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onUseDifferentIdentifier: () => void;
}

export function LoginSetPasswordStep({
  password,
  confirmPassword,
  resolvedIdentifier,
  submitting,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onUseDifferentIdentifier,
}: LoginSetPasswordStepProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
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
        onChange={(e) => onPasswordChange(e.target.value)}
        className="mt-4"
        autoFocus
        helperText={PASSWORD_POLICY_HELPER_TEXT}
      />
      <PasswordInput
        label="Confirm password"
        placeholder="Re-enter password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
        onClick={onUseDifferentIdentifier}
        className="mt-3 block w-full rounded-[8px] py-2 text-center text-caption text-ink-3 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        disabled={submitting}
        aria-label="Use a different identifier"
      >
        Use a different identifier
      </button>
    </form>
  );
}
