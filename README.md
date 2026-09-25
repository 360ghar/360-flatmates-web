# 360 Flatmates Web

A modern web platform for finding compatible roommates and shared living spaces. Built with React, TypeScript, and Tailwind CSS.

## Overview

[![360 Flatmates overview](.wiki/video/overview-poster.png)](.wiki/video/overview.mp4)

*Click the poster to watch the full overview video (2:23)*

## Tech Stack

- **Framework**: Vite + React Router v7 (SPA, no SSR)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with custom design tokens
- **State**: Zustand (client) + TanStack React Query (server)
- **Auth**: Supabase (Phone OTP, Password, Google OAuth)
- **Real-time**: Supabase private Broadcast via backend bootstrap config
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
  components/   ui/ (primitives), molecules/, organisms/, landing/, onboarding/, page-clients/
  components/paper/   PaperScene, PaperMiniScene, NavIcons, generated art.ts
  hooks/        custom hooks; queries/ holds the TanStack Query hooks
  lib/          API client, auth, stores (zustand), schemas, SEO, compatibility engine
  pages/        routes by domain: app/, auth/, admin/, public/
  styles/       globals.css (Tailwind v4 @theme tokens, dark mode, paper utilities)
public/          fonts/Gambarino-Regular.woff2, icons, OG image, sitemap
scripts/         build scripts; generate-paper-art.py (scene art for web + Flutter)
e2e/             Playwright specs
docs/            OpenAPI mirror, audit-2026-09.md
DESIGN.md        design tokens (identical in the Flutter repo)
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

## Wiki

Comprehensive codebase documentation is available in the [GitHub Wiki](https://github.com/360ghar/360-flatmates-web/wiki). The wiki source lives in `.wiki/` and is auto-published to the GitHub Wiki on push to main via `.github/workflows/publish-wiki.yml`. To re-render the video overview after major changes, run `npm run wiki:render-video`.

## License

Private — all rights reserved.
