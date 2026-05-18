# Repository Guidelines

## Project Structure & Module Organization

```
src/
  components/   # Shared UI components (atomic: ui/, molecules/, organisms/, landing/, onboarding/, page-clients/)
  hooks/        # Custom React hooks + TanStack Query hooks (queries/)
  lib/          # Utilities, API client, stores, schemas, SSE, compatibility engine, Supabase config
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
npm run dev       # Start Vite dev server (port 5173)
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint check
npm test          # Run Vitest unit tests
npm run test:e2e  # Playwright end-to-end tests
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

Vite + React Router v7 SPA consuming a shared FastAPI backend (`/api/v1`). Client-rendered with no SSR. Authentication via Supabase (Phone OTP + Password + Google OAuth). State management via Zustand (local state) and TanStack React Query (server state). Real-time updates via SSE with BroadcastChannel multi-tab dedup. Responsive navigation: bottom nav on mobile, collapsed icon sidebar on tablet, full sidebar on desktop. Three user modes (Room Poster, Co-Hunter, Open to Both) control navigation tabs and feature access. All design tokens are CSS custom properties with dark mode overrides. Route guards (`AuthGuard`, `AdminGuard`, `AuthRedirectGuard`) protect authenticated and admin routes.

## Theme & Appearance

- Default theme: **light** (not system)
- Theme options: Light, Dark, System (follows OS)
- Theme state lives in `uiStore` (`src/lib/stores/ui-store.ts`)
- Theme is applied via `data-theme="dark"` on `<html>` (see `providers.tsx`)
- Flash-prevention script in `index.html` reads persisted preference before paint
- Reusable `<ThemeToggle>` component (`src/components/ui/ThemeToggle.tsx`) with `size` prop (`"sm"` for top-bars, `"md"` for sections)
- Theme toggle is available on: PublicLayout header, AppShell top bar, Profile page, Appearance page (`/settings/appearance`)

## Documentation Maintenance

- **CLAUDE.md** and **AGENTS.md** must be updated whenever project structure, conventions, architecture, key commands, or design-system references change.
- Before finalizing any change, verify these files still accurately describe the codebase.
