import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { validateEnv } from "./lib/env";
import "./styles/globals.css";

try {
  validateEnv();
} catch (err) {
  const message =
    err instanceof Error ? err.message : "Configuration error";

  document.getElementById("root")!.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem;font-family:Inter,system-ui,sans-serif;color:#1F1A14;background:#F4F3EE">
      <div style="max-width:480px;text-align:center">
        <h1 style="font-size:20px;font-weight:600;margin:0 0 12px">Configuration Error</h1>
        <p style="font-size:14px;color:#756F65;margin:0 0 20px;white-space:pre-line">${message}</p>
        <p style="font-size:13px;color:#B5AFA3;margin:0">Set the required environment variables and redeploy.</p>
      </div>
    </div>
  `;
  throw err;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
