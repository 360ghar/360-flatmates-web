# Repository Guidelines

> **Canonical guide: [CLAUDE.md](./CLAUDE.md).** Read it first for stack, structure, commands, and conventions.

## Project Structure & Module Organization

```
src/
  entry.tsx     # Mounts <RouterProvider> (index.html loads it)
  app/          # Data router (routes.tsx, router.tsx), RootLayout, providers, guards, error fallback,
                # prefetch, route-inventory, layouts/ (Public, Auth, App, Focus, Adaptive, Admin,
                # SiteFooter) and layouts/app-shell/ (AppShell, Sidebar, TopBar, MobileTabBar, nav-config)
  features/     # One folder per domain: pages/ components/ hooks/ lib/ store.ts __tests__/
                # landing auth onboarding home listings hosting explore swipe matches chat visits
                # notifications profile settings alerts blog places company admin system pwa
  components/
    ui/         # Design-system primitives (Button, Card, Page/PageHeader, Modal, ChoiceChips, ChoiceCards,
                # SegmentedControl, FactList, StateViews, Skeleton, Toast, ...)
    paper/      # Scene art: PaperScene, PaperMiniScene, CityArt, Stamp, NavIcons, generated art.ts
  hooks/        # Shared hooks (useAuth, useRouteHandle, useDirtyFormGuard, ...) + shared queries/
  lib/          # API client and types, Supabase, SEO, stores (ui, search), schemas, compatibility engine, utils
docs/            # OpenAPI spec (flatmates-openapi.yaml)
plans/           # PRD (prd.md) and UI/UX specification (ui_ux.md)
e2e/             # Playwright E2E specs
tests/           # Integration and contract tests
DESIGN.md        # Canonical design system: colour, type, spacing, elevation, motion, components, page composition
```

Layer rules (ESLint `no-restricted-imports`, tests exempt): `app → features → components/hooks/lib`.
`components/`, `hooks/` and `lib/` never import `@/features/*` or `@/app/*`; features never import
`@/app/*`; only `app/routes.tsx` imports feature pages. Cross-feature imports go one way (for
example `home → listings`, `chat → visits`). Check cycles with
`npx madge --circular --extensions ts,tsx --ts-config tsconfig.json src` (expect none).

Key reference documents:
- **DESIGN.md** — single source of truth for all UI tokens, component specs, and visual targets
- **plans/prd.md** — product requirements and technical architecture
- **plans/ui_ux.md** — detailed page, component, and interaction specifications
- **docs/flatmates-openapi.yaml** — backend API contract (FastAPI at `/api/v1`). Mirror of `360ghar-backend/docs/flatmates-openapi.yaml`; kept byte-identical. The authoritative full spec is `360ghar-backend/docs/openapi.json` (regenerate via `uv run python scripts/generate_openapi.py`). Update the backend copy first, then copy it here.

## Build, Test, and Development Commands

```bash
npm run dev                 # Start Vite dev server (port 5173)
npm run build               # TypeScript check + PWA icon generation + sitemap generation + Vite production build + static HTML generation
npm run lint                # ESLint check
npm test                    # Run Vitest unit tests
npm run test:e2e            # Playwright end-to-end tests
npm run generate:pwa-icons  # Generate PWA standard & maskable PNG icons from favicon.svg
npm run generate:og-image   # Re-render og-image.webp + logo.webp with Chrome (output committed)
npm run generate:static-html # Generate static HTML pages for crawlers (runs after vite build)
```

## Coding Style & Naming Conventions

- **TypeScript** in strict mode; no `any` types
- **Tailwind CSS v4** with custom design tokens defined as CSS custom properties via `@theme` in `globals.css`
- Use Tailwind semantic utilities (`bg-accent`, `text-ink`, `shadow-sm`) over raw values
- **Fonts**: Gambarino (display: `text-display`, `text-h1`–`text-h3`, logo), self-hosted `public/fonts/Gambarino-Regular.woff2`, preloaded + `@font-face` in `index.html`. Body/UI uses `system-ui`. One weight only: never add `font-bold` to display text.
- **Design system**: Paper Diorama (see DESIGN.md). Legacy token names are aliases in `globals.css`: `paper` = page (sky), `surface-soft` = soft fill (DESIGN `paper-1`), `surface` = card (DESIGN `paper-2`), `surface-elevated` = raised (DESIGN `paper-3`), `accent`/`primary` = clay. `paper-1` / `paper-2` / `paper-3` match DESIGN.md exactly. New code may use `bg-sky`, `bg-paper-1`, `bg-paper-2`, `bg-clay`, `text-on-clay`, `bg-pine-soft`, `rounded-cut-*`, `rounded-hand`.
- **Paper primitives**: `src/components/paper/`: `PaperScene` (layered neighbourhood with scroll parallax, `time="night"` for the footer), `PaperMiniScene` (empty/error states via `EmptyState scene=`/`ErrorState`), `CityArt` (postcard skylines), `Stamp`, `NavIcons` (cut-paper nav icons). Utilities in `globals.css`: `paper-grain`, `paper-edge-torn-top|bottom|y`, `paper-edge-ticket`, `paper-edge-perforated`, `paper-edge-scallop-left|bottom`, `paper-press` (buttons), `paper-lift` (cards).
- **Page frame**: every app page is `<Page width="narrow|default|wide">` + `<PageHeader>` (`src/components/ui/Layout.tsx`); the title and Back come from the route `handle` (`useRouteHandle`). Public pages open with `<PageBand>`. Pick-one controls are radio groups: `ChoiceChips`/`ChoiceField`, `ChoiceCards`, `SegmentedControl`. Status is tonal text (`Badge`), facts are a `FactList`; no pill chips for metadata.
- **Class merging**: `cn()` is `clsx` + `tailwind-merge` with the custom type roles and radii registered (`component-utils.ts`). Add a new `text-*` role there too.
- **Map tiles**: OpenStreetMap by default; set `VITE_MAP_TILE_URL` (and `VITE_MAP_TILE_ATTRIBUTION`) for production traffic.
- **Scene art** is generated: `npm run generate:paper-art` (writes `src/components/paper/art.ts` AND the mobile repo's `paper_art.dart`). Never edit `art.ts` by hand.
- **Motion**: content is visible by default — no entrance animation starts at opacity 0. `MotionConfig reducedMotion="user"` wraps the app.
- **Errors in UI**: show `userMessage(err)` from `src/lib/api/errors.ts` (or `mapSupabaseAuthError` for auth), never raw `err.message`.
- **Components**: PascalCase files co-located with tests (`Button.tsx` + `Button.test.tsx` or `__tests__/Button.test.tsx`)
- **Hooks**: camelCase prefixed with `use` (`useCompatibility.ts`)
- **Dark mode**: default is light; toggled via `[data-theme="dark"]` on `<html>`; never hardcode light-only colors; toggle available on public header, app top bar, profile page, and `/settings/appearance`

## Testing Guidelines

- **Vitest** + **React Testing Library** for unit/integration tests
- **Playwright** for E2E flows
- `e2e/a11y.spec.ts` runs axe (WCAG 2.1 AA) on the key routes in both themes; serious or critical findings fail. `e2e/controls.spec.ts` clicks the shell, sheets, radio groups and dialogs with a real pointer and the keyboard.
- Test files: co-located (`Component.test.tsx`) or in `__tests__/` directories

## Commit & Pull Request Guidelines

- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- PRs must reference DESIGN.md tokens for any visual changes
- Verify dark mode rendering for all UI changes
- Include screenshots for visual PRs (both light and dark mode)

## Architecture Overview

Vite + React Router v7 SPA consuming a shared FastAPI backend (`/api/v1`). Client-rendered with no SSR. Authentication via Supabase (Phone OTP + Password + Google OAuth). Progressive Web App (PWA) enabled with service worker caching, offline asset precaching, custom install banner, and manual installation guide modal for iOS Safari. State management via Zustand (local state) and TanStack React Query (server state). Real-time Flatmates updates use Supabase private Broadcast from the `/flatmates/bootstrap` realtime config. Responsive navigation: bottom tabs on phones (five per mode, Chats with an unread badge), an icon rail with tooltips from 768 px, the full sidebar from 1024 px. Three user modes (Room Poster, Co-Hunter, Open to Both) control navigation tabs and feature access. All design tokens are CSS custom properties with dark mode overrides. Routing is a React Router data router (`src/app/routes.tsx`): lazy route modules, one `errorElement` per layout, route `handle` for title / nav tab / Back, `useBlocker` for unsaved-change guards, and `ScrollRestoration`. Route guards (`AuthGuard`, `AdminGuard`, `AuthRedirectGuard`) protect authenticated and admin routes. `/discover` and `/search` use an adaptive layout (app shell when signed in, public layout otherwise). From 1024 px `/chats/:id` is a split view nested under `/chats`.

### Progressive Enhancement & SEO

Build-time static HTML generation (`scripts/generate-static-html.ts`) produces crawler-friendly pages for all public routes without a browser — pure string-template injection into the Vite-built shell. Listing pages (`/discover/:id`) are generated from API data fetched at build time via `scripts/lib/listings.ts`. The generator writes `dist/<route>/index.html` files that Netlify serves directly (taking precedence over the SPA fallback `/* /index.html 200`). Blog content lives in `scripts/lib/blog-content.ts` (shared with `BlogPostPage.tsx`). Route templates live in `scripts/lib/route-content.ts`. Set `PRERENDER_LISTINGS=0` to skip per-listing generation for fast smoke builds. Listing fetches (sitemap + per-listing prerender) gate themselves on `process.env.CONTEXT === "production"` via `shouldFetchListingData()` in `scripts/lib/listings.ts`, so local builds and Netlify deploy previews skip the backend entirely and the SPA fallback handles deep listing links at runtime.

### FOUC Mitigation

Critical-path inline CSS in `index.html` `<head>` prevents flash of unstyled content:
- `#root` starts `visibility: hidden` (hydration gate)
- `entry.tsx` adds `.hydrated` class after React mounts → `#root` becomes `visibility: visible`
- `.noscript-fallback` overrides parent `visibility: hidden` with `visibility: visible !important` — ensures no-JS users and crawlers see content even before hydration
- Theme flash prevention: inline `<script>` reads localStorage and sets `data-theme` synchronously before paint
- Dark mode: critical CSS uses `[data-theme="dark"]` selectors for correct colors before Tailwind loads

## Theme & Appearance

- Default theme: **light** (not system)
- Theme options: Light, Dark, System (follows OS)
- Theme state lives in `uiStore` (`src/lib/stores/ui-store.ts`)
- Theme is applied via `data-theme="dark"` on `<html>` (see `src/app/providers.tsx`)
- Flash-prevention script in `index.html` reads persisted preference before paint
- Reusable `<ThemeToggle>` component (`src/components/ui/ThemeToggle.tsx`) with `size` prop (`"sm"` for top-bars, `"md"` for sections)
- Theme toggle is available on: PublicLayout header, AppShell top bar, Profile page, Appearance page (`/settings/appearance`)

## Async State & Data Fetching Guidelines

Every page that fetches data must handle all three async states: **loading**, **error**, and **empty**. Never leave a page without skeleton loaders, and never block the entire page UI behind a single API failure.

### Loading States — Skeletons Everywhere

- Every page with API calls must show a **skeleton loader** matching its layout during `isLoading`
- Shared bones: `<Skeleton variant="...">` from `src/components/ui/Skeleton.tsx`: `block` (a single
  bone sized by `className`), `listingCard`, `listingDetail`, `form`, `searchBar`, `filterChips`,
  `moderationRow`.
- Feature skeletons live next to the feature as `<XSkeleton />` in `features/<name>/components/`
  (for example `HomeFeedSkeleton`, `ChatThreadSkeleton`, `VisitCardSkeleton count={4}`). Build new
  ones from the exported `SkeletonRoot`, `shimmer` and `ListingCardSkeleton`.
- Skeletons must match the real layout dimensions (same grid columns, card structure, spacing) — never reuse `listingCard` for blog/people/forms
- Multi-item grids: pass layout via `className` (e.g. `count={6} className="grid gap-4 md:grid-cols-3"`)
- Composite variants announce loading (`role="status"`); leaf `block` bones use `aria-hidden`. Shimmer respects `motion-reduce:animate-none`
- Never show a blank page or generic spinner when content-specific skeletons exist

### Error States — Graceful Degradation

- **Never use a full-page `<ErrorState>` early return** on pages that have non-API-dependent UI (headers, back buttons, navigation, theme toggles, sign-out actions)
- Instead, always render the page chrome (title, back button, page layout) and show **`<InlineError>`** (an `ErrorState` on a card) only for the API-dependent section
- Pages whose **entire content is the API response** (maps, swipe decks, chat threads) may use a full-page error — but only when there is truly nothing else to show
- Pattern for mixed pages:
  ```tsx
  return (
    <Page width="default">
      <PageHeader title="Page title" />            {/* always visible */}
      {data ? <APIDependentContent /> : error ? <InlineError title="Could not load..." onRetry={refetch} /> : null}
    </Page>
  );
  ```
- Use `<AsyncView>` from `src/components/ui/StateViews.tsx` for simple load/error/empty/render patterns
- Use `<EmptyState>` for zero-data states (not errors) and `<ErrorState>` for API failures
- Always provide an `onRetry` callback on `<ErrorState>` when `refetch` is available

### State Management — Zustand vs TanStack Query

- **Server state** (API data): TanStack React Query via hooks in `src/features/<name>/hooks/` (shared ones in `src/hooks/queries/`)
  - All API calls go through TanStack Query hooks — never `useEffect` + `useState` for fetches
  - Use `isLoading` (not `isFetching`) for initial-load skeleton decisions
  - Stale time and refetch intervals are configured per-query in the hook
- **Client-only state** (UI toggles, form drafts, preferences): Zustand stores in `src/lib/stores/` (shared) and `src/features/<name>/store.ts`
  - `uiStore` for theme, toasts, modals, sidebar
  - `searchStore` for filter state
  - `swipeStore` (`features/swipe/store.ts`) for animation direction
  - `mapStore` (`features/explore/store.ts`) for viewport state
  - All stores use **vanilla `createStore()`** pattern (not `create()` with hook wrapper) — this enables React-free consumption in providers, integration hooks, and tests
- **Never** mix server state into Zustand stores — let TanStack Query own the cache
- **Optimistic updates**: use TanStack Query's `onMutate` + `onError` rollback pattern for mutations
- **Account deletion**: `useDeleteAccount` (`src/hooks/queries/useProfiles.ts`) calls `DELETE /users/me` and clears the entire query cache (`queryClient.clear()`) on success. The Profile page handler then best-effort `signOut()`s (the backend already hard-deletes the Supabase user) and navigates to `/login`. The confirm modal requires typing `DELETE` exactly before the destructive button enables (see ui_ux.md §7.19).

## Documentation Maintenance

- **Wiki** (`.wiki/`): 58-page codebase wiki auto-published to GitHub Wiki on push to main via `.github/workflows/publish-wiki.yml`.
  - Update wiki pages when architecture, features, systems, or primitives change significantly.
  - Run `npm run wiki:render-video` to re-render the video overview after major changes.
  - The video source lives in `.wiki/video/source/` and uses HyperFrames with the pre-redesign branding (Rausch, Inter); re-render it with the Paper Diorama tokens before the next publish.
- **CLAUDE.md** and **AGENTS.md** must be updated whenever project structure, conventions, architecture, key commands, or design-system references change.
- **DESIGN.md** is the single source of truth for UI tokens. Visual changes must update it in the same commit.
- Before finalizing any change, verify these files still accurately describe the codebase.
