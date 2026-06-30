# Web Browser User Stories

Use this folder for Playwright user stories that require routing, real layout, browser APIs, viewport behavior, or auth-wall behavior.

Local authenticated stories should be gated by `E2E_REAL_AUTH` unless a deterministic mocked backend fixture is used. Do not rely on stale `.auth/user.json` state as proof of authenticated behavior.
