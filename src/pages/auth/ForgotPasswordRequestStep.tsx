import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ForgotPasswordRequestStep({
  channel,
  input,
  onInputChange,
  submitting,
  onSubmit
}: {
  channel: "phone" | "email";
  input: string;
  onInputChange: (value: string) => void;
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
      <Input
        label="Phone or email"
        type={channel === "phone" ? "tel" : "text"}
        inputMode={channel === "phone" ? "tel" : undefined}
        autoComplete="username"
        placeholder="you@example.com or 98765 43210"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        className="mt-5"
        autoFocus
      />
      <Button
        type="submit"
        fullWidth
        className="mt-5"
        loading={submitting}
        disabled={input.trim().length < 3}
      >
        Send OTP
      </Button>
    </form>
  );
}
