import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { PASSWORD_POLICY_HELPER_TEXT } from "./_password-policy";

export function ForgotPasswordSetPasswordStep({
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  submitting,
  onSubmit
}: {
  newPassword: string;
  onNewPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <PasswordInput
        label="New password"
        placeholder="Min 8 characters"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => onNewPasswordChange(e.target.value)}
        className="mt-5"
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
        disabled={!newPassword || !confirmPassword}
      >
        Reset Password
      </Button>
    </form>
  );
}
