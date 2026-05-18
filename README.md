# 360 Flatmates Web

A modern web platform for finding compatible roommates and shared living spaces. Built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Vite + React Router v7 (SPA, no SSR)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **State**: Zustand (client) + TanStack React Query (server)
- **Auth**: Supabase (Phone OTP, Password, Google OAuth)
- **Real-time**: SSE with BroadcastChannel multi-tab dedup
- **Maps**: Leaflet + React-Leaflet
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
- **API**: FastAPI backend at `/api/v1`

## Getting Started

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev             # http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | ESLint check |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run typecheck` | TypeScript type checking only |

## Project Structure

```
src/
  components/   # Shared UI (ui/, molecules/, organisms/, landing/, onboarding/)
  hooks/        # Custom hooks + TanStack Query hooks (queries/)
  lib/          # Utilities, API client, stores, schemas, SSE, Supabase
  pages/        # Route pages (app/, auth/, admin/, public/)
docs/           # OpenAPI spec
plans/          # PRD and UI/UX specs
e2e/            # Playwright E2E specs
tests/          # Integration tests
DESIGN.md       # Design system — tokens, components, dark mode
```

## Key Documents

- **DESIGN.md** — design tokens, component specs, visual targets
- **plans/prd.md** — product requirements and architecture
- **plans/ui_ux.md** — page and interaction specifications
- **docs/flatmates-openapi.yaml** — backend API contract

## Conventions

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- PascalCase components, camelCase hooks (`use*`)
- Co-located tests (`Component.test.tsx` or `__tests__/`)
- Dark mode: toggle via `data-theme="dark"` on `<html>`, default is light

## Environment Variables

See `.env.example` for all required variables:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps / Geocoding |
| `VITE_VAPID_PUBLIC_KEY` | Web push notifications |

## License

Private — all rights reserved.
