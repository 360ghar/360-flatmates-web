# Repository Guidelines

> **Canonical guide: [CLAUDE.md](./CLAUDE.md).** Read it first for stack, structure, commands, and conventions.

## Project Structure & Module Organization

```
src/
  components/   # Shared UI components (atomic: ui/, molecules/, organisms/, landing/, onboarding/, page-clients/)
                # Full-page components (LegalPage, PeopleGridPage) live in organisms/, not molecules/
  hooks/        # Custom React hooks + TanStack Query hooks (queries/)
  lib/          # Utilities, API client, stores, schemas, compatibility engine, Supabase config
                # API types split into domain files under lib/api/types/ (common, user, property, conversation, visit, search, match, notification, admin)
                # lib/api/types.ts re-exports all domain types for backward compatibility
  pages/        # React Router pages organized by domain (app/, auth/, admin/, public/)
docs/            # OpenAPI spec (flatmates-openapi.yaml)
plans/           # PRD (prd.md) and UI/UX specification (ui_ux.md)
e2e/             # Playwright E2E specs
tests/           # Integration tests
DESIGN.md        # Canonical design system — color, typography, spacing, shadows, animations, dark mode
```

Key reference documents:
- **DESIGN.md** — single source of truth for all UI tokens, component specs, and visual targets
- **plans/prd.md** — product requirements and technical architecture
- **plans/ui_ux.md** — detailed page, component, and interaction specifications
- **docs/flatmates-openapi.yaml** — backend API contract (FastAPI at `/api/v1`)

## Build, Test, and Development Commands

```bash
npm run dev                 # Start Vite dev server (port 5173)
npm run build               # TypeScript check + PWA icon generation + sitemap generation + Vite production build + static HTML generation
npm run lint                # ESLint check
npm test                    # Run Vitest unit tests
npm run test:e2e            # Playwright end-to-end tests
npm run generate:pwa-icons  # Generate PWA standard & maskable PNG icons from favicon.svg
npm run generate:static-html # Generate static HTML pages for crawlers (runs after vite build)
```

## Coding Style & Naming Conventions

- **TypeScript** in strict mode; no `any` types
- **Tailwind CSS v4** with custom design tokens defined as CSS custom properties via `@theme` in `globals.css`
- Use Tailwind semantic utilities (`bg-accent`, `text-ink`, `shadow-sm`) over raw values
- **Fonts**: Fraunces (headlines), Inter (body), JetBrains Mono (eyebrow/tabular), Instrument Serif (italic emphasis) — loaded via `<link>` in `index.html`
- **Components**: PascalCase files co-located with tests (`Button.tsx` + `Button.test.tsx` or `__tests__/Button.test.tsx`)
- **Hooks**: camelCase prefixed with `use` (`useCompatibility.ts`)
- **Dark mode**: default is light; toggled via `[data-theme="dark"]` on `<html>`; never hardcode light-only colors; toggle available on public header, app top bar, profile page, and `/settings/appearance`

## Testing Guidelines

- **Vitest** + **React Testing Library** for unit/integration tests
- **Playwright** for E2E flows
- Test files: co-located (`Component.test.tsx`) or in `__tests__/` directories
- Integration tests in `tests/integration/`

## Commit & Pull Request Guidelines

- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- PRs must reference DESIGN.md tokens for any visual changes
- Verify dark mode rendering for all UI changes
- Include screenshots for visual PRs (both light and dark mode)

## Architecture Overview

Vite + React Router v7 SPA consuming a shared FastAPI backend (`/api/v1`). Client-rendered with no SSR. Authentication via Supabase (Phone OTP + Password + Google OAuth). Progressive Web App (PWA) enabled with service worker caching, offline asset precaching, custom install banner, and manual installation guide modal for iOS Safari. State management via Zustand (local state) and TanStack React Query (server state). Real-time Flatmates updates use Supabase private Broadcast from the `/flatmates/bootstrap` realtime config. Responsive navigation: bottom nav on mobile, collapsed icon sidebar on tablet, full sidebar on desktop. Three user modes (Room Poster, Co-Hunter, Open to Both) control navigation tabs and feature access. All design tokens are CSS custom properties with dark mode overrides. Route guards (`AuthGuard`, `AdminGuard`, `AuthRedirectGuard`) protect authenticated and admin routes.

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
- Theme is applied via `data-theme="dark"` on `<html>` (see `providers.tsx`)
- Flash-prevention script in `index.html` reads persisted preference before paint
- Reusable `<ThemeToggle>` component (`src/components/ui/ThemeToggle.tsx`) with `size` prop (`"sm"` for top-bars, `"md"` for sections)
- Theme toggle is available on: PublicLayout header, AppShell top bar, Profile page, Appearance page (`/settings/appearance`)

## Async State & Data Fetching Guidelines

Every page that fetches data must handle all three async states: **loading**, **error**, and **empty**. Never leave a page without skeleton loaders, and never block the entire page UI behind a single API failure.

### Loading States — Skeletons Everywhere

- Every page with API calls must show a **skeleton loader** matching its layout during `isLoading`
- Use `<Skeleton variant="...">` from `src/components/ui/Skeleton.tsx` with the appropriate variant:
  - Page-level: `feed`, `listingDetail`, `publicProfile`, `swipeCard`
  - Component-level: `menuItemRow`, `notificationCard`, `conversationRow`, `visitCard`, `statCard`, `chatMessage`, `profileGridCard`, `listingCard`, `searchBar`, `filterChips`, `searchResults`
  - Fallback: `block`, `card`, `listItem`, `profile`
- Skeletons must match the real layout dimensions (same grid columns, card structure, spacing)
- Skeletons must include `aria-hidden="true"` and `motion-reduce:animate-none` for accessibility
- Never show a blank page or generic spinner when content-specific skeletons exist

### Error States — Graceful Degradation

- **Never use a full-page `<ErrorState>` early return** on pages that have non-API-dependent UI (headers, back buttons, navigation, theme toggles, sign-out actions)
- Instead, always render the page chrome (title, back button, page layout) and show **inline `<ErrorState>`** inside a `<Card>` only for the API-dependent section
- Pages whose **entire content is the API response** (maps, swipe decks, chat threads) may use a full-page error — but only when there is truly nothing else to show
- Pattern for mixed pages:
  ```tsx
  return (
    <div className="page-fade">
      <h1 className="text-h1 mb-5">Page Title</h1>   {/* always visible */}
      {data ? (
        <APIDependentContent />
      ) : error ? (
        <Card className="flex items-center justify-center p-8">
          <ErrorState title="Could not load..." onRetry={refetch} />
        </Card>
      ) : null}
    </div>
  );
  ```
- Use `<AsyncView>` from `src/components/ui/StateViews.tsx` for simple load/error/empty/render patterns
- Use `<EmptyState>` for zero-data states (not errors) and `<ErrorState>` for API failures
- Always provide an `onRetry` callback on `<ErrorState>` when `refetch` is available

### State Management — Zustand vs TanStack Query

- **Server state** (API data): TanStack React Query via hooks in `src/hooks/queries/`
  - All API calls go through TanStack Query hooks — never `useEffect` + `useState` for fetches
  - Use `isLoading` (not `isFetching`) for initial-load skeleton decisions
  - Stale time and refetch intervals are configured per-query in the hook
- **Client-only state** (UI toggles, form drafts, preferences): Zustand stores in `src/lib/stores/`
  - `uiStore` for theme, toasts, modals
  - `searchStore` for filter state
  - `swipeStore` for animation direction
  - `mapStore` for viewport state
  - All stores use **vanilla `createStore()`** pattern (not `create()` with hook wrapper) — this enables React-free consumption in providers, integration hooks, and tests
- **Never** mix server state into Zustand stores — let TanStack Query own the cache
- **Optimistic updates**: use TanStack Query's `onMutate` + `onError` rollback pattern for mutations
- **Account deletion**: `useDeleteAccount` (`src/hooks/queries/useProfiles.ts`) calls `DELETE /users/me` and clears the entire query cache (`queryClient.clear()`) on success. The Profile page handler then best-effort `signOut()`s (the backend already hard-deletes the Supabase user) and navigates to `/login`. The confirm modal requires typing `DELETE` exactly before the destructive button enables (see ui_ux.md §7.19).

## Documentation Maintenance

- **Wiki** (`.wiki/`): 58-page codebase wiki auto-published to GitHub Wiki on push to main via `.github/workflows/publish-wiki.yml`.
  - Update wiki pages when architecture, features, systems, or primitives change significantly.
  - Run `npm run wiki:render-video` to re-render the video overview after major changes.
  - The video source lives in `.wiki/video/source/` and uses HyperFrames with project branding (terracotta `#C96442`, Fraunces/Inter typography).
- **CLAUDE.md** and **AGENTS.md** must be updated whenever project structure, conventions, architecture, key commands, or design-system references change.
- **DESIGN.md** is the single source of truth for UI tokens. Visual changes must update it in the same commit.
- Before finalizing any change, verify these files still accurately describe the codebase.
