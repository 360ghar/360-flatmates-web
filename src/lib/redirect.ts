const COUNTRY_CODE = "+91";

export function resolveRedirect(raw: string | null): string {
  if (!raw) return "/home";
  // Same-origin paths only: "//x" and "/\\x" are protocol-relative in browsers (W29).
  return raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/home";
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^91/, "").slice(-10);
  return `${COUNTRY_CODE}${digits}`;
}
