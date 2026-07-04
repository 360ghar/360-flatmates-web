# Systems

Systems are internal architectural building blocks that do not map to a single page or feature. They are reused across the product, and a change in one of them ripples through many surfaces. Use these pages when you need to understand how data gets in and out of the app, how state is partitioned, how routes are protected, or how forms are validated.

If you are looking for an end-to-end feature walkthrough (login, search, chat, visits), start at the [features index](../features/index.md). For a top-level map of the whole codebase, see [Architecture](../overview/architecture.md).

## System pages

- [API client](api-client.md): the `HttpApiClient`, its adapter abstraction, the 401 refresh-and-retry flow, and error normalization.
- [State management (Zustand)](state-management.md): the vanilla `createStore()` pattern, what each store owns, and the hard rule against mirroring server state.
- [Server state (TanStack Query)](server-state.md): the `QueryClient` config, query key conventions, optimistic updates with rollback, and Broadcast-driven invalidation.
- [Routing and guards](routing-guards.md): the four layouts, the four guards (`AuthGuard`, `AdminGuard`, `AuthRedirectGuard`, `GateGuard`), and the gate-state flow.
- [Validation schemas (Zod)](validation-schemas.md): how Zod schemas mirror the backend contract and feed react-hook-form and nuqs.
