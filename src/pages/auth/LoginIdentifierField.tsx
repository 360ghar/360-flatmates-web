import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { LoginStep } from "./_login-form-reducer";

interface LoginIdentifierFieldProps {
  step: LoginStep;
  identifier: string;
  channel: "phone" | "email";
  submitting: boolean;
  onIdentifierChange: (value: string) => void;
  onSubmit: () => void;
}

export function LoginIdentifierField({
  step,
  identifier,
  channel,
  submitting,
  onIdentifierChange,
  onSubmit,
}: LoginIdentifierFieldProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        label="Email or phone"
        type={channel === "phone" ? "tel" : "text"}
        inputMode={channel === "phone" ? "tel" : undefined}
        autoComplete="username"
        placeholder="you@example.com or 98765 43210"
        value={identifier}
        onChange={(e) => onIdentifierChange(e.target.value)}
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
  );
}
