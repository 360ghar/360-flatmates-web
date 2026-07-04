# Tooling

Active contributors: Saksham

The build system, linters, type checker, and code generators that keep the 360 Flatmates web app fast, consistent, and crawlable. For the conventions the tooling enforces, see [patterns and conventions](patterns-and-conventions.md). For setup and commands, see [Getting started](../overview/getting-started.md). Every script referenced here is defined in `package.json`.

## Build

`npm run build` is a seven-step pipeline, not a single command. Each step feeds the next, and a failure in any step halts the build before downstream artifacts are produced. The full pipeline is documented in [SEO and prerendering](../features/seo-prerendering.md), which is the canonical reference for the prerender step. This page summarizes the steps and points to the generators.

```bash
npm run build
```

Expands to:

```bash
tsc --noEmit &&
npx tsx scripts/generate-pwa-icons.ts &&
npx tsx scripts/generate-og-image.ts &&
npx tsx scripts/generate-favicon-ico.ts &&
npx tsx scripts/generate-sitemap.ts &&
vite build &&
npx tsx scripts/prerender.ts
```

| Step | Script | Output |
| --- | --- | --- |
| 1 | `tsc --noEmit` | Type check. Failure halts the build before any artifacts are produced. |
| 2 | `scripts/generate-pwa-icons.ts` | `public/favicon-192.webp`, `public/favicon-512.webp`, plus maskable variants. |
| 3 | `scripts/generate-og-image.ts` | `public/og-image.webp` (1200x630) and `public/logo.webp` (512x512). |
| 4 | `scripts/generate-favicon-ico.ts` | `public/favicon.ico` (multi-resolution). |
| 5 | `scripts/generate-sitemap.ts` | `public/sitemap.xml` (with image-sitemap entries). |
| 6 | `vite build` | `dist/` with the production bundle, service worker, and the SPA shell. |
| 7 | `scripts/prerender.ts` | `dist/<route>/index.html` files, one per public route. |

The first five scripts write into `public/` so Vite copies them into `dist/` during step 6. The prerender step runs last because it serves `dist/` with `vite preview`, so the bundle must already exist. For the prerender internals (the preview server, the headless Chromium capture loop, the route list), see [SEO and prerendering](../features/seo-prerendering.md).

`npm run preview` serves the built `dist/` locally on the Vite preview port, useful for verifying the production bundle and the prerendered HTML.

## Lint

ESLint 9 with the flat config in `eslint.config.mjs`, built on `typescript-eslint` (recommended config) plus `eslint-plugin-react` and `eslint-plugin-react-hooks`. The lint command is `eslint . --max-warnings=0`, so warnings are failures. There is no separate format or type-check step inside lint; that is `tsc --noEmit`.

| Rule | Setting | Note |
| --- | --- | --- |
| `@typescript-eslint/no-explicit-any` | `error` | Use `unknown` with a narrowing guard if you genuinely cannot type something. |
| `@typescript-eslint/no-unused-vars` | `warn` with `argsIgnorePattern` and `varsIgnorePattern` of `^_` | Prefix intentionally unused vars with `_`. |
| `react-hooks/exhaustive-deps` | `error` | Effect deps must be complete. |
| `react/react-in-jsx-scope` | `off` | The React 19 JSX transform does not require the import. |

Ignored paths (no lint, no type check drift): `dist/**`, `node_modules/**`, `.next/**`, `.agents/**`, `.claude/**`, `.factory/**`, `playwright-report/**`, `test-results/**`, `src/lib/api/openapi-types.ts` (generated), and `tsconfig.tsbuildinfo`.

The generated `src/lib/api/openapi-types.ts` is ignored because it is machine-written by `generate:api-types` and would produce noisy diffs if linted.

## Type check

`tsc --noEmit`, exposed as `npm run typecheck` and also run as step 1 of the build. The config lives in `tsconfig.json`:

- `target: ES2022`, `lib: ["dom", "dom.iterable", "es2022"]`. Native `fetch`, `URL`, and `crypto` are available; do not polyfill.
- `strict: true`. Strict null checks, no implicit `any`, no implicit returns.
- `module: esnext`, `moduleResolution: bundler`. Matches the Vite bundler.
- `paths: { "@/*": ["./src/*"] }`. The `@/` alias is resolved here and in Vite via `vite-tsconfig-paths`.
- `jsx: react-jsx`. The React 19 automatic runtime.
- `noEmit: true`, `incremental: true`. The `tsconfig.tsbuildinfo` cache is gitignored.

Test files are excluded from the production `tsconfig.json` `include` (the `src/**/__tests__`, `*.test.*`, and `src/__mocks__` globs are excluded), so the production type check does not depend on test-only types. The test config is `vitest.config.ts`.

## Code generators

| Command | Script | What it generates |
| --- | --- | --- |
| `npm run generate:api-types` | `openapi-typescript docs/flatmates-openapi.yaml -o src/lib/api/openapi-types.ts` | TypeScript types from the OpenAPI contract. Run this whenever the API contract changes and commit the result. |
| `npm run generate:pwa-icons` | `npx tsx scripts/generate-pwa-icons.ts` | The four PWA WebP icons from `public/favicon.svg` via `sharp`. |

The build pipeline runs four more generators that do not have standalone npm scripts (they only run inside `npm run build`):

| Generator | Script | Output |
| --- | --- | --- |
| OG image | `scripts/generate-og-image.ts` | `public/og-image.webp` (1200x630 social preview) and `public/logo.webp` (512x512 brand mark). Embeds the self-hosted Fraunces, Inter, and JetBrains Mono TTFs as base64 into an SVG so `sharp`'s `librsvg` paints the real brand typography. |
| Favicon ICO | `scripts/generate-favicon-ico.ts` | `public/favicon.ico` (16, 32, 48 multi-resolution). Hand-assembles the ICO header and appends PNG bytes from `sharp`. |
| Sitemap | `scripts/generate-sitemap.ts` | `public/sitemap.xml`. Static public routes only (verified against `src/App.tsx`'s `PublicLayout`), plus cities, neighborhoods, blog posts, comparison pages, and dynamic listing pages fetched at build time via `scripts/lib/listings.ts`. Authenticated routes (`/search`, `/search/semantic`) are deliberately excluded. Set `SITEMAP_STRICT=1` on deploy builds to fail loudly on a listing-fetch outage. |
| Prerender | `scripts/prerender.ts` | The `dist/<route>/index.html` files. See [SEO and prerendering](../features/seo-prerendering.md). |

All generators are pure TypeScript run through `npx tsx`, so they share the project's `tsconfig.json` and the `@/` alias. The brand tokens used by the OG image generator are hardcoded from [DESIGN.md](../../DESIGN.md) at the top of `scripts/generate-og-image.ts`.

## Vite config

The config in `vite.config.ts` layers four concerns:

- **React:** `@vitejs/plugin-react` for the fast refresh and JSX transforms.
- **PWA:** `vite-plugin-pwa` with `registerType: "autoUpdate"` and `injectRegister: "auto"`. The manifest (name, icons, theme color, display) is defined inline. See [PWA and install](../features/pwa-install.md) for the manifest fields and the service worker caching strategy.
- **Path alias:** `vite-tsconfig-paths` honors the `@/*` alias from `tsconfig.json`, so `@/lib/...` resolves in both the type checker and the bundler.
- **Dev proxy:** `/api` is proxied to `https://api.360ghar.com` with `changeOrigin: true`, rewriting `/api` to `/app/v1`. See [Getting started](../overview/getting-started.md) "Dev server proxy".

The build target is `es2022`, sourcemaps are on, and the bundle is split into manual chunks to keep the main entry small:

| Chunk | Contents |
| --- | --- |
| `vendor` | `react`, `react-dom`, `react-router` |
| `query` | `@tanstack/*` |
| `supabase` | `@supabase/*` |
| `map` | `leaflet`, `react-leaflet` |

Anything not matched falls into the automatic chunk graph. The performance budget (under 200KB gzip JS bundle, LCP under 2.5s) is in [DESIGN.md](../../DESIGN.md) section 16.

## PostCSS

`postcss.config.mjs` registers a single plugin: `@tailwindcss/postcss` (Tailwind CSS v4). There is no separate Tailwind config file; the v4 plugin reads tokens from the `@theme` block in `src/styles/globals.css`. See [DESIGN.md](../../DESIGN.md) section 2 for the token architecture and the semantic role map.

## Related pages

- [SEO and prerendering](../features/seo-prerendering.md): the canonical deep dive on the seven-step build pipeline and the prerender engine.
- [PWA and install](../features/pwa-install.md): the manifest, the service worker caching strategy, and the install banner.
- [patterns and conventions](patterns-and-conventions.md): the TypeScript, styling, and motion rules the tooling enforces.
- [Getting started](../overview/getting-started.md): install, environment variables, and the command table.

## Key source files

| File | Why it matters |
| --- | --- |
| `package.json` | Every script: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `generate:api-types`, `generate:pwa-icons`. |
| `vite.config.ts` | React plugin, VitePWA plugin, the `@/` alias, the dev proxy, the manual chunks, the build target. |
| `eslint.config.mjs` | The flat ESLint config, the rules, and the ignored paths. |
| `tsconfig.json` | Strict mode, the `@/*` path alias, the ES2022 target, the test-file exclusions. |
| `postcss.config.mjs` | The single `@tailwindcss/postcss` plugin. |
| `scripts/generate-pwa-icons.ts` | PWA WebP generator (standard plus maskable) via `sharp`. |
| `scripts/generate-og-image.ts` | OG image and logo generator with embedded brand fonts. |
| `scripts/generate-favicon-ico.ts` | Multi-resolution ICO generator. |
| `scripts/generate-sitemap.ts` | Sitemap generator (static plus dynamic listing routes). |
| `scripts/prerender.ts` | The prerender engine that writes per-route HTML. |
| `scripts/lib/listings.ts` | Shared build-time listing fetch, used by both the sitemap and the prerender step. |
