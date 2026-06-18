# Maintainers

The `.github/CODEOWNERS` file assigns `@saksham1991999` as the default owner for the entire repository. The entire 360 Flatmates web codebase has a single contributor: **Saksham**. Every subsystem listed below is owned, written, and maintained by one person, with the most recent commit on **2026-06-18**. The table maps each major subsystem to that contributor and the last known activity.

| Subsystem | Recent contributors | Last activity |
| --- | --- | --- |
| Auth (Supabase phone OTP, password, Google, Apple, gate-state guards) | Saksham | 2026-06-15 |
| Compatibility engine (six-dimension scoring, weights, breakdown) | Saksham | 2026-06-15 |
| Messaging (conversations, messages, SSE real-time, Q&A icebreakers) | Saksham | 2026-06-15 |
| Visits (scheduling, reschedule, completion, feedback) | Saksham | 2026-06-15 |
| Listings (property CRUD, moderation lifecycle, boosts, renewals) | Saksham | 2026-06-15 |
| Search and explore (filters, map view, swipe deck, saved searches) | Saksham | 2026-06-15 |
| Admin (moderation queue, reports, dashboard stats) | Saksham | 2026-06-15 |
| Design system (tokens, primitives, dark mode, motion) | Saksham | 2026-06-15 |
| SEO and prerendering (sitemap, OG image, route prerendering) | Saksham | 2026-06-15 |
| Real-time (SSE manager, BroadcastChannel multi-tab dedup) | Saksham | 2026-06-15 |
| PWA (service worker, manifest, install banner, offline precaching) | Saksham | 2026-06-15 |

## Bus factor

The bus factor here is **1**. All institutional knowledge, from the rationale behind the `ws` override to the gate-state guard logic, lives with one person. The wiki exists in large part to spread that knowledge beyond a single head, but it is documentation, not a second contributor.

The recommended next step is to onboard a second contributor on at least one subsystem (auth or the compatibility engine are the highest-leverage places to start, since they are the most load-bearing and the hardest to recover from memory). Until then, every change has exactly one reviewer's worth of context behind it.

## Related pages

- [By the numbers](by-the-numbers.md) for the contributor and commit-cadence statistics behind this table.
- [Overview](overview/index.md) for the map of what each subsystem actually does.
