# Contributing

How to work in the 360 Flatmates web codebase. The conventions and tooling here keep the app warm, fast, and crawlable, so following them is the fastest way to land a change.

If you are setting up the repo for the first time, start with [Getting started](../overview/getting-started.md) for install, environment variables, and the core commands. Then read [patterns and conventions](patterns-and-conventions.md) before writing your first feature.

## Pages in this section

- [Development workflow](development-workflow.md): the branch, code, test, PR, and merge cycle, the conventional commit format, and the pre-PR checklist.
- [Testing](testing.md): the Vitest and Playwright setup, the test pyramid, and how to mock API calls, Supabase auth, and SSE.
- [Debugging](debugging.md): common errors and a symptom, cause, fix troubleshooting table.
- [Patterns and conventions](patterns-and-conventions.md): TypeScript, styling, async state, state management split, routing, components, accessibility, content and voice, and motion.
- [Tooling](tooling.md): the build pipeline, ESLint, the type check, and the code generators for API types, PWA icons, OG image, favicon, and sitemap.

## Source of truth docs

The wiki summarizes the four authoritative docs that live outside it. Read them when a wiki page points you there:

- [DESIGN.md](../../DESIGN.md): all UI tokens, component specs, color, typography, motion, and accessibility.
- [CLAUDE.md](../../CLAUDE.md) and [AGENTS.md](../../AGENTS.md): coding conventions, project structure, and async-state rules.
- [plans/prd.md](../../plans/prd.md): product requirements and technical architecture.
- [plans/ui_ux.md](../../plans/ui_ux.md): page-by-page UI and interaction specs.
- [docs/flatmates-openapi.yaml](../../docs/flatmates-openapi.yaml): the backend API contract.

## Quick links

- [Architecture](../overview/architecture.md) for the system diagram.
- [Glossary](../overview/glossary.md) for project-specific terms.
