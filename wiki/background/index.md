# Background

The "why" behind the codebase. Every choice recorded here was made on purpose and survives because it earned its place. Where the [architecture](../overview/architecture.md) page describes what the system *is*, this section explains why it is that way, what alternatives were considered, and where the known traps are buried.

The 360 Flatmates web app is a Vite + React 19 SPA that consumes a shared FastAPI backend at `/api/v1`. It ships as a PWA, prerenders its public surface for SEO, and treats a six-dimension lifestyle compatibility engine as its core differentiator. The decisions in the child pages reflect the constraints of a single-contributor, AI-assisted codebase that must be trustworthy enough for rent and deposits, warm enough to feel human, and disciplined enough to survive a bus factor of one.

## Child pages

- [Design decisions](design-decisions.md), the rationale behind the load-bearing architectural choices (vanilla Zustand stores, prerender over SSR, SSE over WebSockets, the `ApiAdapter` abstraction, the weighted compatibility engine, strict TypeScript, the CSS custom property token system).
- [Pitfalls and danger zones](pitfalls.md), the traps that have already cost time and the fixes that prevent them from recurring.

## Related pages

- [Architecture](../overview/architecture.md) for the system these decisions produced.
- [Lore](../lore.md) for the timeline of when each decision landed.
