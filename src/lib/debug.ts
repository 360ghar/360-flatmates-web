/**
 * Lightweight debug logger for 360 Flatmates.
 *
 * Active when:
 *  - `import.meta.env.DEV` is true (Vite dev server), OR
 *  - `localStorage.getItem("flatmates:debug") === "true"` (manual opt-in in production)
 *
 * All output is prefixed with `[360flatmates]` for easy console filtering.
 *
 * Usage:
 *   import { debug } from "@/lib/debug";
 *   debug.log("HomePage", "profile loaded", profile);
 *   debug.error("HomePage", "bootstrap failed", error);
 */

const PREFIX = "[360flatmates]";

function isEnabled(): boolean {
  try {
    if (import.meta.env.DEV) return true;
    return localStorage.getItem("flatmates:debug") === "true";
  } catch {
    return false;
  }
}

function formatTag(tag: string): string {
  return `${PREFIX} [${tag}]`;
}

export const debug = {
  /** General-purpose log. Hidden in production unless debug mode is on. */
  log(tag: string, message: string, ...args: unknown[]) {
    if (!isEnabled()) return;
    console.log(formatTag(tag), message, ...args);
  },

  /** Warning log. */
  warn(tag: string, message: string, ...args: unknown[]) {
    if (!isEnabled()) return;
    console.warn(formatTag(tag), message, ...args);
  },

  /** Error log. Always fires in dev; production requires debug flag. */
  error(tag: string, message: string, ...args: unknown[]) {
    // Errors always log in dev. In production, respect the debug flag.
    try {
      if (import.meta.env.DEV || localStorage.getItem("flatmates:debug") === "true") {
        console.error(formatTag(tag), message, ...args);
      }
    } catch {
      // localStorage unavailable — silently skip
    }
  },

  /** Collapsible group (open). */
  group(tag: string, label: string) {
    if (!isEnabled()) return;
    console.group(`${formatTag(tag)} ${label}`);
  },

  /** Collapsible group (open, collapsed by default). */
  groupCollapsed(tag: string, label: string) {
    if (!isEnabled()) return;
    console.groupCollapsed(`${formatTag(tag)} ${label}`);
  },

  /** Close group. */
  groupEnd() {
    if (!isEnabled()) return;
    console.groupEnd();
  },

  /** Performance timer. Returns a stop function that logs elapsed ms. */
  timer(tag: string, label: string): () => void {
    if (!isEnabled()) return () => {};
    const start = performance.now();
    return () => {
      const elapsed = (performance.now() - start).toFixed(1);
      console.log(formatTag(tag), `${label} — ${elapsed}ms`);
    };
  },

  /** Dump a full Error object with stack trace. */
  dumpError(tag: string, label: string, error: unknown) {
    try {
      if (!(import.meta.env.DEV || localStorage.getItem("flatmates:debug") === "true")) return;
    } catch {
      return;
    }

    console.group(`${formatTag(tag)} ${label}`);
    if (error instanceof Error) {
      console.error("Message:", error.message);
      if (error.stack) console.error("Stack:", error.stack);
      if ("digest" in error) console.error("Digest:", (error as { digest?: string }).digest);
    } else {
      console.error("Value:", error);
    }
    console.groupEnd();
  },
};
