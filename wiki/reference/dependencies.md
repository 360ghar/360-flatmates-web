# Dependencies

Active contributors: Saksham

The 360 Flatmates web app is a deliberately small dependency tree. The runtime deps are the minimum needed to render a typed React SPA, talk to a FastAPI backend, authenticate through Supabase, validate forms, draw a map, animate transitions, manage SEO tags, and ship as an installable PWA. The dev deps add a Vite build, strict TypeScript, ESLint, Vitest, Playwright, and a single image processor for asset generation. Everything below is pulled from `package.json`; versions are the ranges declared there, not the locked versions in `package-lock.json`.

There is one pinned override worth knowing about up front: `ws` is forced to `8.18.3`. This is a Netlify build fix (a transitive `ws` version broke the serverless build), recorded in [lore](../lore.md). It is the only override in the tree.

## Runtime dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| **react** | `^19.2.6` | The UI runtime. React 19 concurrent features underpin transitions and suspense boundaries. |
| **react-dom** | `^19.2.6` | React DOM renderer. |
| **react-router** | `^7.15.1` | Client-side routing (v7 data-router), route guards, and nested layouts. Not `react-router-dom`, the v7 package is just `react-router`. |
| **@tanstack/react-query** | `^5.90.12` | Server state and caching. Every API call goes through hooks in `src/hooks/queries/`. |
| **zustand** | `^5.0.9` | Client-only UI state. All stores use the vanilla `createStore()` pattern so they can be consumed outside React. |
| **nuqs** | `^2.8.1` | URL query-string state. Syncs filters and search state to the URL. |
| **@supabase/supabase-js** | `^2.84.0` | Auth (phone OTP, password, Google, Apple) and the session the API client reads its bearer token from. |
| **react-hook-form** | `^7.68.0` | Form state and submission for onboarding, profile edit, listing builder, and auth forms. |
| **@hookform/resolvers** | `^5.2.2` | Bridges Zod schemas into react-hook-form's resolver. |
| **zod** | `^4.2.0` | Runtime validation for forms, the env layer (`src/lib/env.ts`), and API response shapes. |
| **leaflet** | `^1.9.4` | The map engine behind the explore map view. |
| **react-leaflet** | `^5.0.0` | React bindings for Leaflet (map container, markers, clusters). |
| **framer-motion** | `^12.38.0` | Animation: swipe deck gestures, page transitions, segmented control spring, modal and drawer motion. Mocked in tests via `src/__mocks__/framer-motion.tsx`. |
| **react-helmet-async** | `^3.0.0` | Per-route `<title>`, meta, and OpenGraph tags for SEO. |
| **lucide-react** | `^0.555.0` | The default icon set for UI (see DESIGN.md section 10). |

The categorical note on state: `zustand` holds client toggles, drafts, and viewport state; `@tanstack/react-query` holds everything that comes from the API. The two are never mixed (see [state management](../systems/state-management.md) and [server state](../systems/server-state.md)).

## Dev dependencies

### Build and language

| Package | Version | Purpose |
| --- | --- | --- |
| **vite** | `^8.0.13` | The dev server and production bundler. |
| **@vitejs/plugin-react** | `^5.1.1` | React Fast Refresh and JSX transform for Vite. |
| **vite-plugin-pwa** | `^1.3.0` | Generates the service worker, web manifest, and registration (autoUpdate). Configured in `vite.config.ts`. |
| **vite-tsconfig-paths** | `^6.1.1` | Resolves the `@/` path alias in Vite from `tsconfig.json`. |
| **typescript** | `^5.9.3` | The compiler. `tsc --noEmit` runs as the first step of `npm run build` and as `npm run typecheck`. |
| **tailwindcss** | `^4.3.0` | Tailwind v4. Reads its config from CSS `@theme` in `src/styles/globals.css`, not a JS file. |
| **@tailwindcss/postcss** | `^4.3.0` | Tailwind v4 PostCSS plugin (the only PostCSS plugin, see `postcss.config.mjs`). |
| **sharp** | `^0.34.5` | Image processing for the asset-generation scripts (PWA icons, OG image, favicon, sitemap previews). |
| **openapi-typescript** | `^7.10.1` | Generates `src/lib/api/openapi-types.ts` from `docs/flatmates-openapi.yaml` via `npm run generate:api-types`. |

### Linting

| Package | Version | Purpose |
| --- | --- | --- |
| **eslint** | `^9.39.1` | Linter, flat config (`eslint.config.mjs`). `npm run lint` runs with `--max-warnings=0`. |
| **typescript-eslint** | `^8.59.3` | TypeScript-aware lint rules (recommended config). |
| **eslint-plugin-react** | `^7.37.5` | React-specific rules. |
| **eslint-plugin-react-hooks** | `^7.1.1` | Hooks rules, including `exhaustive-deps` as an error. |
| **@eslint/eslintrc** | `^3.3.3` | Shared eslintrc helpers used by the flat config. |

### Testing

| Package | Version | Purpose |
| --- | --- | --- |
| **vitest** | `^4.1.6` | Unit and integration test runner. Config in `vitest.config.ts`. |
| **@testing-library/react** | `^16.3.0` | Component rendering and queries. |
| **@testing-library/jest-dom** | `^6.9.1` | DOM matchers (`toBeInTheDocument`, etc.), registered globally in `vitest.setup.ts`. |
| **@testing-library/user-event** | `^14.6.1` | User interaction simulation (click, type). |
| **jsdom** | `^27.2.0` | DOM environment for Vitest (`environment: "jsdom"`). |
| **@playwright/test** | `^1.60.0` | E2E tests in `e2e/`. Also used at build time as the prerender engine (Chromium). |

### Type definitions

| Package | Version | Purpose |
| --- | --- | --- |
| **@types/react** | `^19.2.7` | React type definitions. |
| **@types/react-dom** | `^19.2.3` | React DOM type definitions. |
| **@types/node** | `24.10.1` | Node.js type definitions (pinned exact, not a range). |
| **@types/leaflet** | `^1.9.21` | Leaflet type definitions (react-leaflet does not bundle them). |

## Overrides

```json
"overrides": {
  "ws": "8.18.3"
}
```

`ws` is forced to `8.18.3` across the whole tree. A newer transitive `ws` broke the Netlify serverless build early in the repo's history (2026-05-18); pinning it down was the fix. It is the only override, and it should be revisited if a future `ws` release is confirmed safe on Netlify. The full story is in [lore](../lore.md).

## Related pages

- [Getting started](../overview/getting-started.md) for how to install and run these.
- [Tooling](../how-to-contribute/tooling.md) for the conventions around lint, type-check, and test commands.
- [Cleanup opportunities](../cleanup-opportunities.md) for dependency-related follow-ups.

## Key source files

| File | Role |
| --- | --- |
| `package.json` | Declares every runtime and dev dependency, scripts, and the `ws` override |
| `package-lock.json` | Locked dependency tree (the source of truth for installed versions) |
| `vite.config.ts` | Vite, PWA, and path alias wiring |
| `vitest.config.ts` | Vitest environment, aliases, framer-motion mock |
| `vitest.setup.ts` | jest-dom matcher registration |
| `eslint.config.mjs` | ESLint flat config and ignored paths |
| `postcss.config.mjs` | Tailwind v4 PostCSS plugin |
| `src/lib/env.ts` | Zod env validation (where `zod` shows up at runtime) |
