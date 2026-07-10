import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from "react";
import { useId } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn, focusRing, interactiveMotion } from "./component-utils";

/* -------------------------------------------------------------------------- */
/*  FieldChrome – shared props for all field components                       */
/* -------------------------------------------------------------------------- */

export interface FieldChromeProps {
  label?: string;
  helperText?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  FieldWrapper – shared label + control + help structure                    */
/* -------------------------------------------------------------------------- */

export interface FieldWrapperProps {
  id?: string;
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  children: (fieldIds: {
    controlId: string;
    helperId: string;
    errorId: string;
  }) => ReactNode;
}

function FieldLabel({ id, label }: { id: string; label?: string }) {
  if (!label) return null;
  return (
    <label className="text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3" htmlFor={id}>
      {label}
    </label>
  );
}

function FieldHelp({
  helperId,
  errorId,
  helperText,
  error
}: {
  helperId: string;
  errorId: string;
  helperText?: string;
  error?: string;
}) {
  if (error) {
    return (
      <p className="flex items-center gap-1.5 text-caption text-error" id={errorId}>
        <AlertCircle aria-hidden="true" className="h-4 w-4" />
        {error}
      </p>
    );
  }

  if (helperText) {
    return (
      <p className="text-caption text-ink-3" id={helperId}>
        {helperText}
      </p>
    );
  }

  return null;
}

export function FieldWrapper({
  id,
  label,
  helperText,
  error,
  fullWidth = true,
  children,
}: FieldWrapperProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const helperId = `${controlId}-helper`;
  const errorId = `${controlId}-error`;

  return (
    <div className={cn("flex flex-col gap-2", fullWidth && "w-full")}>
      <FieldLabel id={controlId} label={label} />
      {children({ controlId, helperId, errorId })}
      <FieldHelp error={error} errorId={errorId} helperId={helperId} helperText={helperText} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Input                                                                      */
/* -------------------------------------------------------------------------- */

export interface InputProps
  extends FieldChromeProps,
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> { }

const controlClasses =
  "w-full border border-line bg-surface text-body-md text-ink placeholder:text-ink-3 disabled:cursor-not-allowed disabled:bg-surface-soft disabled:text-ink-4";

export function Input({
  label,
  helperText,
  error,
  leadingIcon,
  trailingIcon,
  fullWidth,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <FieldWrapper id={id} label={label} helperText={helperText} error={error} fullWidth={fullWidth}>
      {({ controlId, helperId, errorId }) => (
        <div
          className={cn(
            "group flex min-h-[var(--control-h-md)] items-center gap-2 rounded-[8px] border border-line bg-surface px-3 focus-within:border-ink focus-within:border-2 focus-within:shadow-focus",
            interactiveMotion,
            error && "border-error focus-within:border-error",
            props.disabled && "bg-surface-soft"
          )}
        >
          {leadingIcon ? (
            <span className="text-ink-3 group-focus-within:text-accent">{leadingIcon}</span>
          ) : null}
          <input
            id={controlId}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            aria-invalid={error ? true : undefined}
            className={cn("min-w-0 flex-1 bg-transparent py-3 outline-none", controlClasses, "border-0 p-0", className)}
            {...props}
          />
          {trailingIcon ? <span className="text-ink-3">{trailingIcon}</span> : null}
        </div>
      )}
    </FieldWrapper>
  );
}

/* -------------------------------------------------------------------------- */
/*  TextArea                                                                   */
/* -------------------------------------------------------------------------- */

export interface TextAreaProps
  extends FieldChromeProps,
  TextareaHTMLAttributes<HTMLTextAreaElement> { }

export function TextArea({
  label,
  helperText,
  error,
  fullWidth,
  className,
  id,
  ...props
}: TextAreaProps) {
  return (
    <FieldWrapper id={id} label={label} helperText={helperText} error={error} fullWidth={fullWidth}>
      {({ controlId, helperId, errorId }) => (
        <textarea
          id={controlId}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            controlClasses,
            focusRing,
            "min-h-[120px] max-h-[240px] resize-y rounded-[8px] px-3 py-3 outline-none focus:border-ink focus:border-2 focus:shadow-focus",
            interactiveMotion,
            error && "border-error focus:border-error",
            className
          )}
          {...props}
        />
      )}
    </FieldWrapper>
  );
}

/* -------------------------------------------------------------------------- */
/*  SelectField                                                                */
/* -------------------------------------------------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends FieldChromeProps,
  SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
}

export function SelectField({
  label,
  helperText,
  error,
  leadingIcon,
  fullWidth,
  className,
  id,
  options,
  placeholder,
  ...props
}: SelectFieldProps) {
  return (
    <FieldWrapper id={id} label={label} helperText={helperText} error={error} fullWidth={fullWidth}>
      {({ controlId, helperId, errorId }) => (
        <div
          className={cn(
            "group flex min-h-[var(--control-h-md)] items-center gap-2 rounded-[8px] border border-line bg-surface px-3 focus-within:border-ink focus-within:border-2 focus-within:shadow-focus",
            interactiveMotion,
            error && "border-error focus-within:border-error",
            props.disabled && "bg-surface-soft"
          )}
        >
          {leadingIcon ? (
            <span className="text-ink-3 group-focus-within:text-accent">{leadingIcon}</span>
          ) : null}
          <select
            id={controlId}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              "min-w-0 flex-1 appearance-none bg-transparent py-3 text-body-md text-ink outline-none disabled:cursor-not-allowed disabled:text-ink-4",
              className
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option disabled={option.disabled} key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-ink-3" />
        </div>
      )}
    </FieldWrapper>
  );
}

