# Patterns and conventions

The rules every contributor must follow. These are summarized from [CLAUDE.md](../../CLAUDE.md), [AGENTS.md](../../AGENTS.md), and [DESIGN.md](../../DESIGN.md); read those for the full text.

## TypeScript

- Strict mode, always. `tsconfig.json` sets `"strict": true` and ESLint enforces `@typescript-eslint/no-explicit-any: error`.
- No `any` types. If you genuinely cannot type something, justify it in a comment and use `unknown` with a narrowing guard.
- Unused vars are a warning with `_`-prefixed ignores for intentional skips.
- Target is ES2022. Native `fetch`, `URL`, and `crypto` are available; do not polyfill.

## Styling

- Tailwind CSS v4 with tokens defined as CSS custom properties in `src/styles/globals.css` and surfaced as utilities via `@theme`.
- **Prefer semantic utilities** (`bg-surface`, `text-content`, `border-line`) over raw values (`bg-white`, `text-black`). Semantic aliases re-resolve in dark mode automatically.
- Use the `toneClasses` map in `src/components/ui/component-utils.ts` for categorical colors. Use the `inkText` tier for text on a `soft` fill, not the `text` tier.
- Never hardcode a hex value in a component. If a token is missing, add it to `globals.css` and document it in [DESIGN.md](../../DESIGN.md) in the same change.
- Dark mode is mandatory. Every visual change is tested in both light and dark. The toggle is `[data-theme="dark"]` on `<html>`.

## Fonts

- Fraunces (display, headlines), Inter (body, UI), JetBrains Mono (eyebrow, tabular), Instrument Serif (italic emphasis). Loaded via `<link>` in `index.html` with `display: swap`.
- Italic emphasis is the Instrument Serif italic of the same headline, never a randomly injected serif word. Audit italic words with descenders.

## Async state (mandatory on every data page)

Every page that fetches data must handle all three async states: **loading, error, empty**.

- **Loading:** a content-shaped `<Skeleton>` from `src/components/ui/Skeleton.tsx` matching the real layout. Skeletons must be `aria-hidden` and `motion-reduce:animate-none`. Never a bare spinner where a skeleton fits.
- **Error:** never a full-page `<ErrorState>` early return on pages that have non-API chrome. Render the page shell and show an inline `<ErrorState>` inside a `<Card>` for the API-dependent section. Always pass `onRetry={refetch}` when available.
- **Empty:** an `<EmptyState>` that tells the user what goes here and how to add it.

Use `<AsyncView>` from `src/components/ui/StateViews.tsx` for simple flows. The full pattern is in [CLAUDE.md](../../CLAUDE.md) "Async State & Data Fetching Guidelines".

## State management split

| Use TanStack Query | Use Zustand |
| --- | --- |
| Anything from `/api/v1` | UI toggles, form drafts, viewport state, theme |
| Hooks in `src/hooks/queries/` | Stores in `src/lib/stores/` |
| Mutations with optimistic update + rollback | Vanilla `createStore()` (not `create()`) |

Never mirror server state into a Zustand store. Never `useEffect + useState` for a fetch, always a Query hook. The vanilla `createStore()` pattern is mandatory so stores can be read from non-React code (integration hooks, providers, tests).

## Routing and code splitting

- Every page is `lazy()`-loaded in `src/App.tsx`. New pages must be added there.
- Route guards: `AuthGuard` (any signed-in user), `AdminGuard` (admin role), `GateGuard` (enforces profile-completion and onboarding gates), `AuthRedirectGuard` (bounces signed-in users away from `/login`). See `src/pages/guards.tsx`.
- Layouts: `PublicLayout`, `AuthLayout`, `AppLayout`, `AdminLayout`. Pick the right one for the page's auth requirements.

## Components

- PascalCase files. Co-located tests (`Button.tsx` + `Button.test.tsx` or `__tests__/Button.test.tsx`).
- Compose shared primitives from `src/components/ui/` instead of re-implementing chrome. Use `<Button>`, `<Card>`, `<Modal>`, `<Input>`, `<Skeleton>`, `<AsyncView>`, etc.
- Every interactive element implements the full state matrix: rest, hover, active, focus-visible, disabled, loading, selected, error. The helpers (`focusRing`, `interactiveMotion`, `elevation`, `controlHeight`) live in `src/components/ui/component-utils.ts`.
- Touch target minimum is 44px (`--touch-min`). Documented compact exceptions: chips (36px), icon buttons (40px), switches.

## Accessibility

- WCAG AA minimum for text, AAA target for hero copy. `ink-4` is decorative only, never body text.
- Color is never the only signal. Always pair a status color with an icon or text.
- Visible `:focus-visible` ring on every interactive element. Modals trap focus and restore it on close.
- Reduced motion is honored globally in `globals.css`. Any motion above a trivial hover must degrade gracefully.

## Content and voice

- Warm, direct, confident. Concrete verbs over filler. "Find", "Book", "Match", not "Elevate", "Seamless", "Unleash".
- One label per intent. Do not mix "Join" / "Get started" / "Start swiping" for the same action.
- **No em dashes anywhere.** Use commas, colons, or parentheses. This is a hard rule in [DESIGN.md](../../DESIGN.md) section 1.
- Errors are plain and actionable, no blame: "We couldn't load your matches. Retry?"

## Motion

- Tokens: `--duration-fast` (120ms), `--duration-normal` (200ms), `--duration-slow` (300ms), `--duration-slowest` (400ms).
- Easings: `--ease-standard`, `--ease-emphasized`, `--ease-spring` (chips and FAB overshoot only).
- Press: `:active { scale(0.97) }` on buttons, cards, menu items.
- Reveal: `.stagger-*` classes or `<RevealSection>` + `useInView` (IntersectionObserver). Never `window` scroll listeners.
- All motion collapses under `prefers-reduced-motion: reduce`, already enforced globally.

## Commit and PR

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
- Visual PRs reference the DESIGN.md tokens used and include light and dark screenshots.
- Verify dark mode rendering for all UI changes.
- Update [CLAUDE.md](../../CLAUDE.md) and [AGENTS.md](../../AGENTS.md) when structure, conventions, or architecture change.
