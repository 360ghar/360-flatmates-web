# Getting started

## Prerequisites

- Node.js 20+ (the project uses ESM, native fetch, and modern syntax; `tsconfig.json` targets ES2022).
- npm (a `package-lock.json` is committed, so use npm for reproducible installs).
- A Supabase project with phone, password, Google, and Apple auth providers enabled.
- A backend running the FastAPI service at a URL you control.
- Playwright's Chromium installed if you want to run E2E tests or do a full production build (the prerender step needs it).

## Install

```bash
git clone <repo-url>
cd 360-flatmates-web
npm install
```

## Environment

Copy the example and fill in your keys. Vite only exposes variables prefixed with `VITE_` to the client bundle.

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | FastAPI backend URL, e.g. `https://api.360ghar.com/api/v1` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key for web push (FCM) |
| `VITE_AUTH_REDIRECT_URL` | Optional override for the Google/Apple OAuth callback URL |

A dev-only test session can be forced by setting `localStorage["flatmates-playwright-auth"] = "true"`; see `getPlaywrightSession()` in `src/hooks/useAuth.ts`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 5173. The dev server proxies `/api` to the configured backend. |
| `npm run build` | Type-check, generate PWA icons, OG image, favicon, sitemap, then `vite build`, then prerender public routes. |
| `npm run lint` | ESLint with zero warnings allowed. |
| `npm run typecheck` | `tsc --noEmit` only. |
| `npm test` | Run Vitest unit and integration tests. |
| `npm run test:integration` | Run only the tests under `tests/integration/`. |
| `npm run test:e2e` | Run Playwright E2E tests under `e2e/`. Starts its own dev server. |
| `npm run generate:pwa-icons` | Regenerate PWA icons from `public/favicon.svg`. |
| `npm run generate:api-types` | Regenerate `src/lib/api/openapi-types.ts` from `docs/flatmates-openapi.yaml` via `openapi-typescript`. |

## Dev server proxy

`vite.config.ts` proxies `/api` to the configured backend, rewriting `/api` to `/app/v1`. This lets the SPA call relative paths in dev while hitting the real backend.

```ts
server: {
  proxy: {
    "/api": {
      target: "https://api.360ghar.com",
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, "/app/v1"),
    },
  },
}
```

## First run checklist

1. Confirm `npm run dev` serves on `http://localhost:5173`.
2. Confirm `npm run lint` and `npm run typecheck` are clean.
3. Confirm `npm test` passes (Vitest).
4. If you changed the API contract, run `npm run generate:api-types` and commit the regenerated file.
5. Before relying on the prerender step, run `npx playwright install chromium` once.

## Path alias

The `@/` alias resolves to `src/`. Both `tsconfig.json` and `vite.config.ts` (via `vite-tsconfig-paths`) honor it. Prefer `@/lib/...` over relative imports.

## Next steps

- Read [patterns and conventions](../how-to-contribute/patterns-and-conventions.md) before writing your first feature.
- Skim [DESIGN.md](../../DESIGN.md) for the token system your components must use.
- Skim [plans/ui_ux.md](../../plans/ui_ux.md) for the page you are working on.
