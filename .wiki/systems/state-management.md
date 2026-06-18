# State management (Zustand)

Active contributors: Saksham

Client-only UI state lives in a set of Zustand stores under `src/lib/stores/`. Server state (anything that comes from `/api/v1`) is owned by TanStack Query and must never be mirrored into Zustand. That boundary is the single most important rule in this layer, and it is enforced by code review rather than by the types.

## Why vanilla `createStore()`

Every store uses the **vanilla `createStore()`** import from `zustand/vanilla`, not the `create()` hook wrapper:

```ts
import { createStore } from "zustand/vanilla";
export const uiStore = createUiStore(); // returns a vanilla store, not a hook
```

The reason is that vanilla stores are plain objects with `.getState()`, `.setState()`, and `.subscribe()`, so they can be read and mutated from anywhere: React components, the SSE handlers in `src/lib/sse/`, the provider effect in `src/providers.tsx`, and unit tests. A `create()`-based hook store would force every non-React caller to either mount a React tree or reach into internals.

React components consume a store through the `useStore` binding from `zustand`:

```tsx
import { useStore } from "zustand";
import { uiStore } from "@/lib/stores/ui-store";
const theme = useStore(uiStore, (s) => s.theme);
```

Selectors are mandatory. Reading the whole state object (`useStore(uiStore, (s) => s)`) re-renders on every state change, which defeats the point of splitting state in the first place.

## Persistence via `storage.ts`

Stores that should survive a reload wrap their creator in Zustand's `persist` middleware and pass a `createSafeJsonStorage()` from `src/lib/stores/storage.ts`. That helper falls back to an in-memory `Map` (capped at 50 entries) when `window.localStorage` is unavailable, which keeps tests and SSR/prerender passes from throwing. Each store declares a `partialize` function so only the durable slice (for example theme and palette, not the open-modal flag) is written to disk.

## The hard rule: server state never lives here

Zustand stores hold UI state only: toggles, drafts, the active viewport, filter chips, toast queues, theme. Any value whose source of truth is the backend must go through a TanStack Query hook in `src/hooks/queries/`. Mirroring server data into Zustand creates two sources of truth, and the two inevitably drift (stale cache, missed invalidation, optimistic update applied to the wrong copy). See [Server state](server-state.md) for the other half of the boundary, and `CLAUDE.md` for the project-wide rule.

The one exception is auth: `authStore` does hold the Supabase `Session` and `User`, because `useAuth()` is a singleton subscription that needs to be readable from guards and providers without going through Query. Even there, the API-derived gate stage is fetched through the API client (`getAuthState`) and only the resulting stage string is cached in the store.

## Stores at a glance

| Store | File | Owns | Persisted |
| --- | --- | --- | --- |
| `authStore` | `src/lib/stores/auth-store.ts` | Supabase `user`/`session`, `loading`, login modal state, `pendingRedirect`, `midAuthFlow`, backend `authStage` + `missingProfileFields` | No |
| `uiStore` | `src/lib/stores/ui-store.ts` | `theme`, `palette`, sidebar state + width, active modal/drawer, SSE connection flags, `reducedMotion`, toast queue | Yes (theme, palette, sidebar, sidebarWidth, reducedMotion) |
| `searchStore` | `src/lib/stores/search-store.ts` | `filters` (defaults in `DEFAULT_SEARCH_FILTERS`), `recentSearches`, `viewMode` (`grid`/`list`/`map`), active-filter counter | Yes (filters, recentSearches, viewMode) |
| `mapStore` | `src/lib/stores/map-store.ts` | Map `center`, `zoom`, `selectedPinId`, `bounds`, `MapFilters` | No |
| `swipeStore` | `src/lib/stores/swipe-store.ts` | `currentIndex`, `isAnimating`, swipe `direction`, `cardQueue`, `isExpanded` | No |
| `onboardingStore` | `src/lib/stores/onboarding-store.ts` | `currentStep`, `OnboardingDraft` (validated through `onboardingDraftSchema`), `lastSavedAt` | Yes (currentStep, draft, lastSavedAt) |
| `chatStore` | `src/lib/stores/chat-store.ts` | `activeConversationId`, per-conversation `draftMessages`, `isTyping` flags, `showInfoPanel` | No |

Each store is created through a `createXStore()` factory and exported as a singleton, so tests can build an isolated instance if they need to.

## Conventions worth copying

- **Equality guards before `set`.** Most actions check whether the new value equals the old and return the previous state object (`set((s) => s.theme === theme ? s : { theme })`). This prevents spurious re-renders when a no-op action fires.
- **Typed state shapes.** Every store exports its `*State` interface; actions live alongside data in the same object so `useStore(store, (s) => s.setTheme)` returns a stable reference.
- **Reset hooks.** Stores that hold user-scoped data expose a reset action (`searchStore.resetFilters`, `onboardingStore.clearDraft`) that `src/providers.tsx` calls on sign-out, alongside `queryClient.clear()`.
- **Drafts validated on hydrate.** `onboardingStore.hydrateDraft` runs the candidate through `onboardingDraftSchema.safeParse` before accepting it, so a corrupted localStorage entry cannot crash the onboarding flow (see [Validation schemas](validation-schemas.md)).

## Where each store is consumed

- `searchStore` drives the FilterPanel and the URL-synced search page (see [Search and explore](../features/search-explore.md)).
- `onboardingStore` drives the multi-step onboarding flow (see [Profile and onboarding](../features/profile-onboarding.md)).
- `uiStore` is read from `src/providers.tsx` to apply the `data-theme` and `data-palette` attributes, and from the Toast viewport.
- `authStore` is read by every guard in `src/pages/guards.tsx` (see [Routing and guards](routing-guards.md)).
- `mapStore` and `swipeStore` are scoped to the map and swipe surfaces respectively.

For the broader architectural split between Zustand and TanStack Query, see [Architecture](../overview/architecture.md) and [CLAUDE.md](../../CLAUDE.md).

## Key source files

| File | Role |
| --- | --- |
| `src/lib/stores/auth-store.ts` | Supabase session, login modal, `midAuthFlow`, backend gate stage |
| `src/lib/stores/ui-store.ts` | Theme, palette, sidebar, modals, drawers, SSE flags, toasts |
| `src/lib/stores/search-store.ts` | Search filters, recent searches, view mode, active-filter counter |
| `src/lib/stores/map-store.ts` | Map viewport center/zoom/bounds, selected pin, map filters |
| `src/lib/stores/swipe-store.ts` | Swipe deck index, animation direction, card queue, expanded flag |
| `src/lib/stores/onboarding-store.ts` | Onboarding step pointer and validated draft |
| `src/lib/stores/chat-store.ts` | Active conversation, draft messages, typing flags, info panel |
| `src/lib/stores/storage.ts` | `createSafeJsonStorage()` with in-memory fallback |
| `src/lib/stores/index.ts` | Barrel re-export of all stores |
