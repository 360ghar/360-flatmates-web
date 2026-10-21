import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toAppError } from "./errors";

const SOURCE_PREFIX = /^(body|query|path)\./;

/**
 * Put the messages of a 422 (`details.fields`) on the form fields they name.
 * `field` keeps its source prefix (`body.title`). A wire key that has another
 * name in the form goes through `rename` (`full_address` -> `address`).
 *
 * Returns the line to show above the form, or null when the error is not a 422
 * with fields (the caller then shows `userMessage`). Messages that no form
 * field took are in the line; when every field took its message the line only
 * points at them.
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  formFields: readonly string[],
  rename: Readonly<Record<string, string>> = {}
): string | null {
  const appError = toAppError(error);
  if (appError.type !== "validation") return null;
  const entries = Object.entries(appError.fields);
  if (entries.length === 0) return null;

  const unplaced: string[] = [];
  for (const [field, messages] of entries) {
    const wire = field.replace(SOURCE_PREFIX, "");
    const name = rename[wire] ?? wire;
    const message = messages[0];
    if (formFields.includes(name)) setError(name as Path<T>, { type: "server", message });
    else unplaced.push(`${wire}: ${message}`);
  }
  return unplaced.length > 0 ? unplaced.join(". ").slice(0, 300) : "Some details need fixing. The fields are marked below.";
}
