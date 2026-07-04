# Glossary

Project-specific terms used across the codebase, design docs, and this wiki.

## User roles and modes

| Term | Meaning |
| --- | --- |
| **Room Poster** (`room_poster`) | A user who has a room or property and wants to find a compatible flatmate to fill it. Sees listing management and dashboard tabs. |
| **Room Seeker** (`seeker`) | A user looking for a room in an existing flat. Sees browse and swipe tabs. |
| **Co-Hunter** (`co_hunter`) | A user looking for people to search for a home with, rather than an existing room. |
| **Open to Both** (`open_to_both`) | A user flexible between posting a room and co-hunting. Gets the full navigation set. |
| **Flatmates mode** | The umbrella term for the four values above. Defined in `src/lib/data/domain.ts` as `FLATMATE_MODE_VALUES`. |
| **Admin** | A user whose Supabase `app_metadata.role === "admin"`. Can access `/admin/*` moderation routes. |

## Auth and gate states

| Term | Meaning |
| --- | --- |
| **Gate state** / **auth stage** | A backend-computed value from `GET /users/me/auth-state` that tells the client whether the user must still complete profile or onboarding before reaching the app. |
| **`active`** | The user has completed profile and onboarding. The app loads normally. |
| **`profile_completion`** | The user is authenticated but missing required profile fields. `GateGuard` redirects to `/complete-profile`. |
| **`app_onboarding`** | The user has a complete profile but has not finished onboarding. `GateGuard` redirects to `/onboarding`. |
| **mid-auth flow** | A flag on `authStore` set during multi-step auth (OTP verify, set-password, password reset). Suppresses the auth-redirect guard so a half-finished flow is not bounced. |
| **Last auth method** | A masked identifier hint persisted to `localStorage` and reported to the backend after a successful sign-in, so the login page can pre-select phone vs email vs Google. See `src/lib/lastAuthMethod.ts`. |

## Compatibility

| Term | Meaning |
| --- | --- |
| **Lifestyle dimension** | One of six axes scored by the compatibility engine: `sleep_schedule`, `cleanliness`, `food_habits`, `smoking_drinking`, `guests_policy`, `work_style`. |
| **Compatibility profile** | The subset of a flatmate profile that the engine reads. Type: `CompatibilityProfile` in `src/lib/compatibility/types.ts`. |
| **Match threshold** | The per-dimension cutoff (defined as `COMPATIBILITY_MATCH_THRESHOLD`) above which two values count as a "match" for that dimension. |
| **Compatibility weight** | The multiplier applied to each dimension's score before summing. Defined in `COMPATIBILITY_WEIGHTS` in `src/lib/compatibility/dimensions.ts`. |
| **Compatibility color** | Visual bucket for the overall score: green (>=70), amber (40-69), red (<40). Always paired with the numeric value, never color alone. |

## Real-time

| Term | Meaning |
| --- | --- |
| **Broadcast event type** | One of six backend events delivered over the Supabase private Broadcast channel. See `FLATMATES_REALTIME_EVENTS` in `src/hooks/useFlatmatesRealtime.ts`. |
| **Realtime config** | The `FlatmatesBootstrap.realtime` object from `/flatmates/bootstrap`, containing the Supabase provider, private channel, and event list. |
| **Reconnect catch-up** | Broad query invalidation after a disconnected Broadcast channel successfully resubscribes, because Broadcast events are not replayed. |

## Listings and visits

| Term | Meaning |
| --- | --- |
| **Listing** | A room or property posted by a room poster. Backed by the `property` domain in the API. |
| **Discoverable listing** | A listing that is `active` and visible on the public `/discover` surface and in the sitemap. Fetched at build time by `scripts/lib/listings.ts` for prerendering. |
| **Boost** / **Renew** | Mutations on a listing that bump its visibility or extend its lifetime. See `useBoostListing`, `useRenewListing` in `src/hooks/queries/useProperties.ts`. |
| **Visit** | A scheduled in-person or virtual viewing of a listing, with its own lifecycle (requested, confirmed, completed, cancelled). |

## SEO and build

| Term | Meaning |
| --- | --- |
| **Prerender** | A build-time step that uses Playwright Chromium to render each public route to static HTML in `dist/`. |
| **Supported city** | A city for which the app generates a `/cities/:slug` page. Listed in `src/lib/seo/config.ts` as `SUPPORTED_CITIES`. |
| **Neighborhood** | A sub-area of a supported city with its own `/cities/:slug/:neighborhood` page. Defined in `src/lib/seo/neighborhoods.ts`. |
| **Comparison page** | A `/compare/:slug` page that positions 360 Flatmates against a competitor (NoBroker, Facebook groups, Housing, MagicBricks, Flatmate India). |

## UI and design

| Term | Meaning |
| --- | --- |
| **Token** | A named value in `src/styles/globals.css` (primitive, semantic role, or component tier). Documented in [DESIGN.md](../../DESIGN.md) section 2. |
| **Semantic role** | An intent-named alias over a primitive (e.g. `text-content`, `bg-surface-raised`). Re-resolves automatically in dark mode. |
| **Tone** | One of the categorical palette families (`accent`, `success`, `warning`, `error`, `info`, `neutral`, `teal`, `blue`, `purple`, `pink`). Each tone has `soft`, `text`, `inkText`, `border`, `icon`, `dot` utilities in `toneClasses`. |
| **inkText** | The accessible text color tier for use on the matching `soft` background. Always use `inkText`, not `text`, when placing text on a soft fill. |
| **Elevation tier** | One of `flat`, `raised`, `overlay`, `modal`. Pairs a surface with a shadow. |
