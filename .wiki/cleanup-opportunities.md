# Cleanup opportunities

Active contributors: Saksham

Where the 360 Flatmates web codebase could be tightened if someone had the time. This is a forward-looking page: nothing here is broken, and the codebase ships clean (strict TypeScript, ESLint with `--max-warnings=0`, zero `TODO`/`FIXME`/`HACK` markers across `src/`). The opportunities below are about reducing complexity, staying current on dependencies, and confirming that already-deprecated paths stay dead.

## Complexity hotspots

The largest files by line count are the natural refactor candidates. None of them are bugs, but each is large enough that a change to one risks touching unrelated concerns. The average `.tsx` file is roughly 213 lines, so everything in this table is 2 to 4 times the mean. File sizes are from the [by the numbers](by-the-numbers.md) snapshot taken on 2026-06-18.

| File | Lines | What could be extracted |
| --- | --- | --- |
| `src/components/organisms/SwipeDeck.tsx` | 918 | The clear outlier. Split the gesture/animation logic, the card stack state machine, and the empty/match resolution UI into separate modules. The deck itself should compose them. |
| `src/pages/app/PostPage.tsx` | 666 | The listing builder entry point. Likely co-locates multi-step form state, validation, and submission. Extract per-step components and a dedicated `useListingBuilder` hook. |
| `src/pages/auth/LoginPage.tsx` | 639 | Auth flows were overhauled in early June. The identifier-status state machine (password vs OTP) and each auth method's UI are candidates for extraction into smaller components. |
| `src/components/ui/Skeleton.tsx` | 585 | Large because it carries one variant per content layout, not because of deep logic. Splitting would not reduce complexity, only file length. A lower-priority target. |
| `src/components/onboarding/OnboardingStepContent.tsx` | 519 | One branch per onboarding step. Extract each step into its own component file behind a shared layout. |
| `src/pages/app/ProfileEditPage.tsx` | 507 | Form state, field validation, and image upload likely co-located. Extract a `useProfileEdit` hook and per-section form components. |
| `src/components/organisms/MapView.tsx` | 498 | Map rendering, marker logic, and viewport state. Extract the marker layer and the viewport store bridge. |
| `src/components/organisms/ChatThread.tsx` | 498 | Message list rendering, composition input, and realtime-driven optimistic updates. Extract the message list and the composer. |
| `src/pages/app/MyListingEditPage.tsx` | 447 | Mirrors `PostPage` for editing. Share the form schema and per-step components with the builder. |
| `src/pages/app/ProfilePage.tsx` | 440 | Profile display, compatibility breakdown, and actions. Extract the compatibility section and the actions cluster. |
| `src/pages/app/SearchPage.tsx` | 435 | Search input, filter state, and results layout. Extract the filter bar and the results grid. |
| `src/pages/app/VisitDetailPage.tsx` | 435 | Visit details, status actions, and reschedule flow. Extract the status actions and the reschedule modal. |

The pattern across the page files is the same: a single component owns form state, validation, submission, and the full layout. Splitting each into a hook (state) plus a layout (presentational) plus per-section components would bring them closer to the 213-line mean without changing behavior. `SwipeDeck.tsx` is the highest-value target because it is the product's hero surface and the most-changed file in the repo's history.

## Dependency freshness

All dependency versions are read from `package.json` and are current for mid-2026. The stack is intentionally modern, and the target is ES2022, so there is no legacy drag.

| Dependency | Version | Notes |
| --- | --- | --- |
| `react` / `react-dom` | 19.2 | Current. React 19 is the active major. |
| `vite` | 8.0 | Current. The build target (`es2022`) and manual chunking live in `vite.config.ts`. |
| `tailwindcss` / `@tailwindcss/postcss` | 4.3 | Current. Tailwind v4 with `@theme` token generation. |
| `@tanstack/react-query` | 5.90 | Current. Server-state layer. |
| `zustand` | 5.0 | Current. Used via the vanilla `createStore()` pattern (see [design decisions](background/design-decisions.md)). |
| `zod` | 4.2 | Current. Schema validation. |
| `react-router` | 7.15 | Current. |
| `@supabase/supabase-js` | 2.84 | Current. |
| `framer-motion` | 12.38 | Current. |
| `react-helmet-async` | 3.0 | Current. Used by the prerenderer to flush per-route meta. |
| `leaflet` / `react-leaflet` | 1.9 / 5.0 | Current. |
| `lucide-react` | 0.555 | Current. |
| `nuqs` | 2.8 | Current. URL search-param state. |
| `react-hook-form` / `@hookform/resolvers` | 7.68 / 5.2 | Current. |
| `@playwright/test` | 1.60 | Current. Also the prerenderer's browser driver. |
| `vitest` | 4.1 | Current. |
| `typescript` | 5.9 | Current. |
| `eslint` / `typescript-eslint` | 9.39 / 8.59 | Current. |
| `sharp` | 0.34 | Current. PWA and OG image generation. |
| `jsdom` | 27.2 | Current. |

The only pinned override is `ws` at `8.18.3`, a transitive dependency pinned early on (commit 3bffa7e, 2026-05-18) to fix a Netlify build failure. It is still in the `overrides` block and worth a periodic check to see whether the upstream that forced the pin has moved on. No dependency in the list is unusually old or carries a known issue that affects this codebase.

## Dead ends

The codebase has actively pruned deprecated paths, which is healthy. Two removals are on record:

- The **`/share/:id` redirect route** was removed on 2026-06-15 (commit 8b8cc48). Share functionality now resolves through a different path. If you find any remaining link or reference to `/share/`, it is a stale pointer and should be removed.
- The **legacy compatibility modules** were deprecated on 2026-05-20 (commit ca0a6bc) and replaced by the current `src/lib/compatibility/` module. The current module is the one that survived the rogue-agent incident the same day (see [lore](lore.md#the-rogue-agent-incident-may-20)).

A grep for `TODO`, `FIXME`, and `HACK` across `src/` returns **zero matches**, which is unusual for a 38,328-line codebase and either indicates unusual discipline or that follow-ups are tracked outside the code. The pragmatic reading for a single-contributor repo is the latter. There is no deferred-work backlog embedded in the source to pick up.

Spot checks for obviously unused exports did not surface any clear candidates. The exported hooks and utilities that look niche (for example `useCountUp`, `useScrollProgress`) are consumed by landing and public surfaces, and removing them would require confirming the call graph first. The codebase appears lean: the cleanup value is in splitting the complexity hotspots above, not in deleting dead code.

## Key source files

| File | Role |
| --- | --- |
| `package.json` | Dependency versions and the build/lint/test scripts |
| `src/components/organisms/SwipeDeck.tsx` | Largest file (918 lines), highest-value refactor target |
| `src/pages/app/PostPage.tsx` | Listing builder, candidate for hook plus per-step extraction |
| `src/pages/auth/LoginPage.tsx` | Auth UI, candidate for per-method component extraction |
| `src/components/ui/Skeleton.tsx` | 585 lines of layout variants, low logic complexity |
| `vite.config.ts` | Build target, manual chunking, and the `ws` override context |

## Related pages

- [By the numbers](by-the-numbers.md) for the file-size snapshot behind the complexity table.
- [Lore](lore.md) for the deprecation and rogue-agent history.
- [Patterns and conventions](how-to-contribute/patterns-and-conventions.md) for the rules any refactor must follow.
- [Design decisions](background/design-decisions.md) for the rationale that shaped the current structure.
