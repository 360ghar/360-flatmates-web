import { Link } from "react-router";

import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface LoginPasswordStepProps {
  password: string;
  submitting: boolean;
  onPasswordChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function LoginPasswordStep({
  password,
  submitting,
  onPasswordChange,
  onBack,
  onSubmit,
}: LoginPasswordStepProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <PasswordInput
        label="Password"
        placeholder="Enter password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
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
        <Button type="button" variant="secondary" onClick={onBack}>
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
  );
}
