/**
 * Last-used auth method memory.
 *
 * Persists which method a user last authenticated with (plus a masked hint of
 * the identifier they used) so the login screen can pre-select / highlight it.
 *
 * Stored in localStorage under a stable, namespaced key. The value is a small
 * JSON blob: `{ method, identifierHint, ts }`. The identifier is always stored
 * **masked** — never the raw email/phone — so it is safe to surface on screen.
 *
 * This module is the reference implementation copied to the other web apps
 * (frontend, real-estate-admin-dashboard, 360-viewer); keep it framework-free
 * (no React, no app-specific imports) so it ports cleanly.
 */

export type AuthMethod =
  | "google"
  | "email_password"
  | "phone_password"
  | "phone_otp"
  | "email_otp";

export interface LastAuthMethod {
  method: AuthMethod;
  /** Masked identifier hint (e.g. `j••@gmail.com`, `+91 98•••• 3210`). Never raw. */
  identifierHint?: string;
  /** Epoch milliseconds of when this method last succeeded. */
  ts: number;
}

const STORAGE_KEY = "360ghar:lastAuthMethod";

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/**
 * Mask an email or phone identifier into a privacy-safe hint.
 * - Email: keeps first char of local part + domain → `j••@gmail.com`
 * - Phone: keeps country/leading + last 4 digits → `+91 98•••• 3210` style
 */
export function maskIdentifier(identifier: string): string {
  const value = identifier.trim();
  if (!value) return "";

  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    const head = local.slice(0, 1);
    return `${head}${"•".repeat(Math.max(local.length - 1, 1))}@${domain}`;
  }

  // Treat as phone — keep leading "+" group and the last 4 digits.
  const plus = value.startsWith("+") ? "+" : "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 4) {
    return `${plus}${"•".repeat(digits.length)}`;
  }
  const last4 = digits.slice(-4);
  const masked = "•".repeat(digits.length - 4);
  return `${plus}${masked}${last4}`;
}

/** Read the persisted last-used auth method, or `null` if absent/invalid. */
export function getLastAuthMethod(): LastAuthMethod | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastAuthMethod>;
    if (!parsed || typeof parsed.method !== "string") return null;
    return {
      method: parsed.method as AuthMethod,
      identifierHint:
        typeof parsed.identifierHint === "string"
          ? parsed.identifierHint
          : undefined,
      ts: typeof parsed.ts === "number" ? parsed.ts : 0,
    };
  } catch {
    return null;
  }
}

/**
 * Persist the last-used auth method. The `identifier` is masked before storage.
 * Failures (private mode, quota) are swallowed — this is a best-effort hint.
 */
export function setLastAuthMethod(method: AuthMethod, identifier?: string): void {
  if (!isBrowser()) return;
  try {
    const value: LastAuthMethod = {
      method,
      identifierHint: identifier ? maskIdentifier(identifier) : undefined,
      ts: Date.now(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* best-effort */
  }
}

/** Clear the persisted hint (e.g. on explicit sign-out if desired). */
export function clearLastAuthMethod(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* best-effort */
  }
}
