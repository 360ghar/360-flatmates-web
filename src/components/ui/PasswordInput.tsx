import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, type InputProps } from "./Input";
import { focusRing } from "./component-utils";

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  showToggle?: boolean;
}

export function PasswordInput({
  showToggle = true,
  className,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  const toggleButton = showToggle ? (
    <button
      type="button"
      tabIndex={-1}
      aria-label={visible ? "Hide password" : "Show password"}
      className={`text-ink-3 hover:text-ink ${focusRing}`}
      onClick={() => setVisible((prev) => !prev)}
    >
      {visible ? (
        <EyeOff aria-hidden="true" className="h-4 w-4" />
      ) : (
        <Eye aria-hidden="true" className="h-4 w-4" />
      )}
    </button>
  ) : undefined;

  return (
    <Input
      {...props}
      type={visible ? "text" : "password"}
      className={className}
      trailingIcon={toggleButton}
    />
  );
}
