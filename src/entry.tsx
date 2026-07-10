import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { validateEnv } from "./lib/env";
import { debug } from "./lib/debug";
import "./styles/globals.css";

// ── Global error handlers ──────────────────────────────────────────────────
// Catch errors that happen outside React's render cycle (module init, event
// handlers, setTimeout callbacks, etc.) and log them via the debug logger so
// they're never silently swallowed.
window.addEventListener("error", (event) => {
  debug.dumpError("GlobalError", `Uncaught error: ${event.message}`, event.error ?? event);
});

window.addEventListener("unhandledrejection", (event) => {
  debug.dumpError("GlobalError", "Unhandled promise rejection", event.reason);
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

try {
  validateEnv();
} catch (err) {
  const rawMessage = err instanceof Error ? err.message : "Configuration error";
  const message = escapeHtml(rawMessage);

  const rootEl = document.getElementById("root")!;
  rootEl.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;font-family:Inter,system-ui,sans-serif;color:#222222;background:#ffffff">
      <div style="max-width:480px;text-align:center">
        <h1 style="font-size:20px;font-weight:600;margin:0 0 12px">Configuration Error</h1>
        <p style="font-size:14px;color:#6a6a6a;margin:0 0 20px;white-space:pre-line">${message}</p>
        <p style="font-size:13px;color:#929292;margin:0 0 16px">Set the required environment variables and redeploy.</p>
        <p style="font-size:13px;margin:0"><a href="/maintenance" style="color:#ff385c;text-decoration:underline">Go to maintenance page</a></p>
      </div>
    </div>
  `;
  rootEl.classList.add("hydrated");

  // Schedule a redirect to the maintenance page so users with broken
  // configs land on a styled fallback instead of a stuck boot screen.
  // The inline error above gives the diagnostic context; the redirect
  // happens shortly after so the message is briefly visible.
  setTimeout(() => {
    try {
      window.location.replace("/maintenance");
    } catch {
      /* ignore — the inline error is already rendered */
    }
  }, 1500);

  throw err;
}

const rootEl = document.getElementById("root")!;
createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

// Hydration gate: #root starts visibility:hidden via critical inline CSS
// to prevent FOUC. Once React has mounted, reveal the app content.
// rAF ensures the class is added after the browser paints the first frame.
requestAnimationFrame(() => {
  rootEl.classList.add("hydrated");
});
