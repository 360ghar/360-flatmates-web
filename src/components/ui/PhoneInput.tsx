import { useId } from "react";
import { cn, interactiveMotion } from "./component-utils";

export function formatFullPhone(localDigits: string): string {
  return `+91${localDigits}`;
}

interface PhoneInputProps {
  value: string;
  onChange: (rawDigits: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  id?: string;
  label?: string;
  /** HTML autocomplete hint for the underlying input (defaults to `tel`). */
  autoComplete?: string;
}

export function PhoneInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  className,
  id,
  label,
  autoComplete = "tel"
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(-10);
    onChange(digits);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <label
          className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3"
          htmlFor={inputId}
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "group flex min-h-12 items-center gap-2 rounded-[9px] border border-line bg-surface px-3 focus-within:scale-[1.01] focus-within:border-accent/50 focus-within:shadow-focus",
          interactiveMotion,
          disabled && "bg-paper-4"
        )}
      >
        <span className="select-none text-body-md font-medium text-ink-3">+91</span>
        <span className="h-6 w-px bg-line" />
        <input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          placeholder="98765 43210"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          autoFocus={autoFocus}
          className="min-w-0 flex-1 bg-transparent py-3 text-body-md text-ink outline-none placeholder:text-ink-3 disabled:cursor-not-allowed disabled:text-ink-4"
        />
      </div>
    </div>
  );
}
