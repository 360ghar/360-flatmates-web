# Web Client Inventory — 360 Flatmates Web (360-flatmates-web)

**Repo:** `/Users/sakshammittal/Documents/360ghar/github/flatmates/360-flatmates-web` (React 19 + TS, react-query 5, zod 4, zustand 5, react-router 7)
**Branch surveyed:** `feat/payments-wiki-blog-auth-batch` (working tree clean at the time of scan)
**Backend branch under contract:** `backend/feat/payments-wiki-blog-auth-batch`
**Mode:** READ-ONLY — no edits, no commits, no test runs

> **Headline finding.** The Web client was largely pre-emptively migrated to cursor pagination. The `CursorPage<T>` envelope, `VisitCursorPage`, `PropertyCursorPage`, `PropertySearchCursorPage`, `ConversationCursorPage`, `MatchCursorPage`, `IncomingLikeCursorPage`, `NotificationCursorPage`, `AdminListingCursorPage`, `AdminReportCursorPage` types all already exist (`src/lib/api/common.types.ts:32-37`, `visit.types.ts:53`, `property.types.ts:108-122`, `conversation.types.ts:60`, `match.types.ts:30-32`, `notification.types.ts:9`, `admin.types.ts:38,52`). The `useInfiniteQuery` paths and `getNextPageParam` are correctly wired to `next_cursor`/`has_more` in `useSearch.ts`, `useMatches.ts`, `useConversations.ts`, `useAdmin.ts`. The remaining risk is concentrated in the *single-fetch* hooks (useVisits, useNotifications, useMyProperties, usePeers, useBlockedUsers, useSavedSearches, useSearchAlerts), the OpenAPI YAML being stale, and 4 e2e specs and 6 unit test fixtures that still assert the legacy `{items, total}` shape.

---

## A. Hook call sites (per-hook inventory)

All `useQuery` / `useInfiniteQuery` hooks live in `src/hooks/queries/`. The `apiClient` (`src/lib/api/index.ts:36`) is the only HTTP entry point; every hook goes through it.

### A1. `useSearch.ts` (`src/hooks/queries/useSearch.ts`)
- `webSearchOptions(filters)` — `useQuery` — `GET /properties` — expects `PropertySearchCursorPage` envelope (`response.items, .next_cursor, .has_more, .limit, .total?`) and re-projects into a `WebSearchResponse` shape for the rest of the app (lines 17-58). **Cursor-shaped ✓ (but expects `items` not `results` on the wire).**
- `infiniteWebSearchOptions(filters)` — `useInfiniteQuery` — `GET /properties?cursor=&limit=` — identical envelope, `getNextPageParam` reads `lastPage.has_more ? lastPage.next_cursor : undefined` (lines 76-121). **Cursor-driven ✓.**
- `savedSearchesOptions` / `useSavedSearches` — `GET /flatmates/web/saved-searches` (line 134) — expects `SavedSearch[]` (single fetch, not paginated).
- `useCreateSavedSearch` — `POST /flatmates/web/saved-searches` (line 153).
- `useDeleteSavedSearch` — `DELETE /flatmates/web/saved-searches/{id}` (line 169).
- `searchAlertsOptions` / `useSearchAlerts` — `GET /flatmates/web/alerts` (line 184) — expects `SearchAlert[]`.
- `useCreateSearchAlert` / `useUpdateSearchAlert` / `useDeleteSearchAlert` — `POST/PUT/DELETE /flatmates/web/alerts[/{id}]` (lines 198, 212, 226).

**Migration note:** infinite path is correct. The saved-searches and search-alerts lists are still single-fetch (`SavedSearch[]` / `SearchAlert[]`); backend's cursor migration will break them unless the new contract still returns a raw array for these endpoints. Confirm with backend.

### A2. `useVisits.ts` (`src/hooks/queries/useVisits.ts`)
- `useVisits(filters?)` — `useQuery` — `GET /visits?status=&upcoming=&past=&limit=&cursor=` — **declares `VisitCursorPage` envelope** and unwraps to `response.items` (lines 16-25). **Cursor-shaped ✓, but no infinite variant — UI fetches all visits in one shot** (`src/pages/app/VisitsPage.tsx:322`).
- `useVisit(id)` — `GET /visits/{id}` — single object (lines 28-39).
- `useCreateVisit` — `POST /visits` (line 80).
- `useUpdateVisit(id)` — `PUT /visits/{id}` (line 128).
- `useCancelVisit(id)` — `POST /visits/{id}/cancel` (line 159).

**Migration note:** Hook is correct, but `VisitsPage` still does client-side tab filtering on the entire in-memory visit list (`filterVisitsByTab` at `src/pages/app/VisitsPage.tsx:39-66`). After backend changes to confirm cursor filter semantics, decide whether the page should call `useVisits({ status, upcoming })` server-side.

### A3. `useConversations.ts` (`src/hooks/queries/useConversations.ts`)
- `conversationsOptions` / `useConversations` — `useQuery` — `GET /flatmates/conversations` — **declares `ConversationCursorPage` envelope** and returns `response.items` (lines 21-30). Cursor-shaped ✓.
- `useConversation(id)` — `GET /flatmates/conversations/{id}` (lines 32-43).
- `messagesInfiniteOptions(id)` / `useMessages` — `useInfiniteQuery` — `GET /flatmates/conversations/{id}/messages?limit=&before=` — declares `MessageListResponse` (`{messages, total, has_more}`) and uses `before=<oldest_message_id>` as the next cursor (lines 50-78). **Cursor-driven via `before=` (legacy shape, not the new `cursor=`) — should be confirmed against backend; if the new contract uses `cursor`, this is wrong.**
- `useSendMessage` — `POST /flatmates/conversations/{id}/messages` (line 119) — uses optimistic `tempIdCounterRef`.
- `useCreateConversation` — `POST /flatmates/conversations` (line 192).
- `useMarkConversationRead` — `POST /flatmates/conversations/{id}/mark-read` (line 227).

**Migration note:** Conversations list is cursor-shaped but is not paginated in the UI (`src/pages/app/ChatsPage.tsx:13`). Messages cursor uses `before=` (a stable, non-changing identifier); if the backend moved to opaque `cursor=`, this needs to flip. High blast radius — chat is a top-of-funnel page.

### A4. `useMatches.ts` (`src/hooks/queries/useMatches.ts`)
- `matchesOptions` / `useMatches` — `useQuery` — `GET /flatmates/matches` — declares `MatchCursorPage` and unwraps to `response.items` (lines 21-32). Cursor-shaped ✓.
- `incomingLikesInfiniteOptions` / `useIncomingLikesInfinite` — `useInfiniteQuery` — `GET /flatmates/likes?cursor=&limit=20` — declares `IncomingLikeCursorPage`, `getNextPageParam` reads `has_more ? next_cursor : undefined` (lines 38-50). **Cursor-driven ✓.** Used by `LikesPage` (`src/pages/app/LikesPage.tsx:4`).
- `incomingLikesOptions(limit, cursor)` / `useIncomingLikes` — **deprecated**, single-fetch, kept for back-compat (lines 60-83).
- `useUnmatchMutation` — `PUT /flatmates/matches/{id}/unmatch` (line 86).

**Migration note:** Matches list is still single-fetch even though it is now cursor-shaped (`src/pages/app/MatchesPage.tsx:5`). If the new backend returns a cursor for `/flatmates/matches` only when `cursor=` is supplied, the hook is fine; otherwise `MatchesPage` will silently cap.

### A5. `useAdmin.ts` (`src/hooks/queries/useAdmin.ts`)
- `useAdminListings(filters?)` — `useQuery` — `GET /flatmates/moderation/listings` — declares `AdminListingCursorPage` and unwraps to `response.items` (lines 88-100). Cursor-shaped ✓.
- `useAdminModerate` — `PUT /flatmates/moderation/listings/{id}` (line 103) — `optimisticRemove` from both array and infinite cache snapshots (lines 116-145).
- `useInfiniteAdminListings(filters?)` — `useInfiniteQuery` — `GET /flatmates/moderation/listings?limit=20&cursor=` — declares `AdminListingCursorPage`, `getNextPageParam` reads `has_more ? next_cursor : undefined` (lines 158-179). **Cursor-driven ✓.** Used by `ModerationListingsPage`.
- `useAdminReports(filters?)` — `useQuery` — `GET /flatmates/moderation/reports` — declares `AdminReportCursorPage` (lines 182-192). Cursor-shaped ✓.
- `useInfiniteAdminReports(filters?)` — `useInfiniteQuery` — `GET /flatmates/moderation/reports?limit=20&cursor=` (lines 195-216). **Cursor-driven ✓.** Used by `ModerationReportsPage`.
- `useAdminStats` — `GET /flatmates/moderation/stats` (line 222).
- `useAdminReportAction` — `PUT /flatmates/moderation/reports/{id}` (line 240).

**Migration note:** Both admin queues are correctly dual-implemented (single-fetch + infinite) with `optimisticRemove` working on both shapes (lines 116-145 and 268-294). Lowest migration risk in the inventory.

### A6. `useProperties.ts` (`src/hooks/queries/useProperties.ts`)
- `myPropertiesOptions` / `useMyProperties` — `useQuery` — `GET /properties/me` — declares `PropertyCursorPage` and unwraps to `response.items` (lines 18-25). Cursor-shaped ✓.
- `propertyOptions(id)` / `useProperty` — `GET /properties/{id}` (lines 28-37).
- `useCreateProperty` — `POST /properties` (line 51).
- `useUpdateProperty(id)` — `PUT /properties/{id}` (line 73) — optimistic merge into `["properties", id]` + `["properties", "mine"]`.
- `useDeleteProperty(id)` — `DELETE /properties/{id}` (line 116) — optimistic remove.
- `useUploadPropertyImage` — `POST /properties/{id}/images` (line 145).
- `useBoostListing` — `POST /properties/{id}/boost` (line 167).
- `useRenewListing` — `POST /properties/{id}/renew` (line 189).

**Migration note:** `/properties/me` is single-fetch only — if a room-poster accumulates many listings the entire list comes back in one shot. The hook is shape-correct but no infinite variant exists.

### A7. `useNotifications.ts` (`src/hooks/queries/useNotifications.ts`)
- `notificationsOptions(filters?)` / `useNotifications` — `useQuery` — `GET /flatmates/notifications` — declares `NotificationCursorPage` and unwraps to `response.items` (lines 15-26). Cursor-shaped ✓.
- `useMarkNotificationRead` — `PUT /flatmates/notifications/{id}` (line 41).
- `useMarkAllNotificationsRead` — `PUT /flatmates/notifications` (line 60).

**Migration note:** Single-fetch only. `AppShell` (`src/components/organisms/AppShell.tsx:114`) uses this to compute the bell badge via `data.filter(n => !n.is_read).length`; `NotificationsPage` (`src/pages/app/NotificationsPage.tsx:13`) does the same. If the new contract is paginated, neither page requests a large enough `limit` and the badge will underreport.

### A8. `useMapView.ts` (`src/hooks/queries/useMapView.ts`)
- `mapViewOptions(filters)` / `useMapView` — `useQuery` — `GET /properties?lat=&lng=&radius=&price_min=&price_max=&sharing_type=&limit=100` — declares `PropertyCursorPage` and projects to `MapViewResponse` shape (lines 24-55). **Cursor-shaped ✓** (uses `items`/`total` fields).
- `propertyToPin` (lines 13-22) — local mapping helper.

**Migration note:** This is the most fragile single-fetch path — it hard-codes `limit: 100` for the map viewport. If the new contract caps `limit` lower (or the cursor expects `cursor` instead of `limit`), the map will silently lose pins past the cap with no obvious error.

### A9. `useProfiles.ts` (`src/hooks/queries/useProfiles.ts`)
- `myProfileOptions` / `useMyProfile` — `GET /flatmates/profile` (line 8). Single object.
- `profileOptions(id)` / `useProfile` — `GET /flatmates/profiles/{id}` (lines 19-28). Single object.
- `peerProfilesOptions(filters?)` / `usePeers` — `GET /flatmates/profiles?city=&budget_min=&budget_max=&move_in=&limit=&cursor=` — declares `PeerCursorPage` and unwraps to `response.items || []` (lines 32-43). **Cursor-shaped ✓**, single-fetch.
- `useUpdateProfile` — `PATCH /flatmates/profile` (line 55).
- `useCreateProfile` — `POST /flatmates/profile` (line 72).
- `useDeleteAccount` — `DELETE /users/me` (line 84) — also covered by `useAuth.ts` for the Supabase half.

**Migration note:** `HomePage` (`src/pages/app/HomePage.tsx:64-66`) and `useSwipeDeck` both use `usePeers` with `limit: 8`; this is fine but they are silently capped.

### A10. Remaining smaller hooks (in `src/hooks/queries/`)
- `useBootstrap` (`useBootstrap.ts:25`) — `GET /flatmates/bootstrap` — validated against `flatmatesBootstrapSchema` via Zod.
- `useCatalogs` (`useCatalogs.ts:6-12`) — `GET /flatmates/catalogs` (auth=false) — single array.
- `useCities` / `useLocalities` / `useAmenities` — derived from the catalogs cache (lines 16-37).
- `useCompatibility(peerId)` (`useCompatibility.ts:7`) — `GET /flatmates/web/compatibility/{peerId}`.
- `useDashboardStats` (`useDashboard.ts:11`) — `GET /flatmates/web/dashboard`.
- `useListingAnalytics(id, period)` (`useDashboard.ts:21`) — `GET /flatmates/web/listings/{id}/analytics?period=`.
- `useReportUserMutation` (`useReports.ts:6`) — `POST /flatmates/reports`.
- `useRecordProfileView` (`useProfileViews.ts:6`) — `POST /flatmates/profile-views`.
- `useVoteSocietyTag` (`useSocietyTags.ts:43`) — `POST /flatmates/listings/{id}/society-tags/votes`.
- `useSwipeDeck` (`useSwipes.ts:14`) — `GET /flatmates/profiles` (the same cursor page as `usePeers`).
- `useSwipeAction` (`useSwipes.ts:30`) — `POST /flatmates/swipes`.
- `useBlockedUsers` (`useBlocks.ts:11`) — `GET /flatmates/blocks` — **expects a flat `BlockedUser[]`** (single-fetch, NOT paginated).
- `useBlockUser` / `useUnblockUser` (`useBlocks.ts:21,33`) — `POST/DELETE /flatmates/blocks[/{id}]`.
- `useReverseGeocode` (`useReverseGeocode.ts:11`) — wraps `lib/api/nominatim.ts` (a direct OSM call, not our backend).
- `useShareCard(listingId, format?)` (`useShareCard.ts:8`) — `GET /flatmates/web/listings/{id}/share-card?format=`.

---

## B. Type modules needing updates (`src/lib/api/*.types.ts`)

All hand-written types live in `src/lib/api/*.types.ts`. The generated `openapi-types.ts` is **gitignored / not present** (no `src/lib/api/openapi-types.ts` file exists in the working tree, only a reference in `eslint.config.mjs:28` ignoring it and in `package.json:16` generating it). The build-time `npm run generate:api-types` command exists but the resulting file is not committed.

| File | Status / existing types | What to add or change |
|------|------|------|
| `common.types.ts` | `CursorPage<T>` already at `lines 32-37` with `{items, next_cursor, has_more, limit, total?}` ✓ | None — canonical envelope. **New: add a strict `CursorPage<T>` no-extra-fields helper if backend rejects unknown fields.** |
| `property.types.ts` | `PropertyCursorPage` (line 108), `PropertySearchCursorPage` (line 116), `PropertySearchMeta` (line 124), deprecated `PaginatedPropertyResponse` (line 98) ✓ | Add `BlogPostStatus` enum if Web consumes blog post status. Add any new fields the payments/blog batches add. |
| `visit.types.ts` | `VisitCursorPage` (line 53), `VisitFilters` (line 56), deprecated `VisitList` (line 47) ✓ | If backend changes `VisitCreate`/`VisitUpdate` payload (e.g. adds `payment_id` or `rating` numeric), update here. The `ratingToInterestLevel` 3-bucket collapse in `VisitDetailPage.tsx:69-73` is flagged in the audit. |
| `conversation.types.ts` | `ConversationCursorPage` (line 60), `MessageListResponse` (lines 53-57) with `messages/total/has_more` ✓ | **High risk: confirm `MessageListResponse` is still the contract post-migration.** If backend changed to `CursorPage<MessageOut>`, this entire file breaks. |
| `match.types.ts` | `MatchCursorPage`, `IncomingLikeCursorPage` (lines 30-32), deprecated `MatchesResponse` (line 23) ✓ | None for now. |
| `notification.types.ts` | `NotificationCursorPage` (line 9), `NotificationFilters` (line 26) ✓ | None for now. |
| `user.types.ts` | `PeerCursorPage` (line 169) ✓ | Add `BlockCursorPage` if backend migrates `/flatmates/blocks` (current `useBlockedUsers` expects a flat array, see A10). |
| `admin.types.ts` | `AdminListingCursorPage`, `AdminReportCursorPage` (lines 38, 52), deprecated `AdminListingsResponse` (line 27), `AdminReportsResponse` (line 41) ✓ | None for now. |
| `search.types.ts` | `SearchFilters` (line 31) includes `cursor`/`limit` (lines 56-57), `WebSearchResponse` (line 60) is the *client* projection shape ✓ | **Add `SearchFilters` field for blog post filters if the Web will consume blog posts directly via API.** |
| `types.ts` | barrel re-exporter (line 1-9) ✓ | Update if new type modules are added (e.g. `payments.types.ts`). |
| `auth.ts` (not a types file but holds `AuthStateResponse`) | at line 119 | None for now. |
| **`payments.types.ts`** — **MISSING** | | **New: `PaymentMethodOut`, `RazorpayOrderResponse`, `PaymentStatus` enum, `RazorpayWebhookPayload` for `/payments/*`. Web has no current client.** |
| **`blog.types.ts`** — **MISSING** | | **New: `BlogPostStatus` enum, `BlogPostSummary`, `BlogPostDetail`, `BlogPreviewTokenResponse` for `/blog/posts/*` and `/blog/posts/preview/{token}`. Currently BlogPage and BlogPostPage are static hardcoded content (`src/pages/public/BlogPage.tsx:9-67`, `src/pages/public/BlogPostPage.tsx:17-93`).** |
| **`webhook.types.ts`** — **MISSING** | | **New: `WebhookEventEnvelope` for `/webhooks/auth/*`. Web does not consume these directly; backend-only. No client types needed unless Web is to display webhook status.** |

---

## C. Test fixtures that need updating

All Vitest fixtures mock `apiClient.request` via `vi.mock("@/lib/api", ...)` and assert on the call shape AND the cached shape. Every test below was inspected end-to-end.

| File | Risk | Mock setup line | Current mocked shape | New shape needed | What needs to change |
|------|------|-----------------|----------------------|------------------|----------------------|
| `src/hooks/__tests__/useVisits.test.tsx` | **HIGH** | `useVisits.test.tsx:50-58` | `{visits: [...], total: 1}` (legacy `VisitList`) | `{items: [...], next_cursor, has_more, limit, total?}` | The fixture hands back `{visits, total}` but the hook calls `response.items` (`useVisits.ts:24`) — test will pass only because no assertion is done on the items array itself, but the cache assertion at line 53 will silently mismatch. **Must be updated to `{items: [...], next_cursor: null, has_more: false, limit: ...}`.** |
| `src/hooks/__tests__/useSearch.test.tsx` | **MEDIUM** | `useSearch.test.tsx:39-47` | `{items: [], total: 0, next_cursor, has_more, limit, filters_applied, search_center}` (correct cursor shape) | Same | No change needed for cursor. The hook *projection* into `WebSearchResponse` (`useSearch.ts:48-55`) still expects `results` not `items` internally — that's a hand-rolled adapter and is fine. |
| `src/hooks/__tests__/useMapView.test.tsx` | **MEDIUM** | `useMapView.test.tsx:34-40` | `{items: [], total: 0, next_cursor, has_more, limit}` (cursor shape) | Same | Hook projects to `MapViewResponse` (`useMapView.ts:52-55`) — works. The test asserts the *projected* shape (`{clusters:[], pins:[], total_listings:0}`), which is independent of the wire. |
| `src/hooks/__tests__/useConversations.test.tsx` | **MEDIUM** | `useConversations.test.tsx:97-101` | `{messages: [...], total: 1, has_more: false}` (legacy `MessageListResponse` — correct for current contract) | Confirm — if backend now uses `CursorPage<MessageOut>`, change to `{items, next_cursor, has_more, limit, total?}`. The hook unwraps `lastPage.messages` (`useConversations.ts:75-77`) and `getNextPageParam` reads `lastPage.has_more` and `lastPage.messages[0].id`. **If the wire format changes from `before=<msg_id>` to opaque `cursor`, the `before` query param disappears and `getNextPageParam` must return the cursor instead.** |
| `src/hooks/__tests__/useMatches.test.tsx` | **LOW** | `useMatches.test.tsx:33-39` | `[MatchSummary]` (array) | Confirm `GET /flatmates/matches` still returns an array | Currently the hook unwraps `response.items` (`useMatches.ts:28-31`). Test mocks the *cache* with `mockMatches: MatchSummary[]` and asserts cache equality — independent of the wire. |
| `src/hooks/__tests__/useSwipes.test.tsx` | **LOW** | `useSwipes.test.tsx:36-40` | `[{id, full_name, mode, ...}]` (array) | Confirm `GET /flatmates/profiles` returns cursor | Hook unwraps `response.items` (`useSwipes.ts:14-19`). |
| `src/hooks/__tests__/useProperties.test.tsx` | **LOW** | `useProperties.test.tsx:25-31` | single `Property` (no pagination) | n/a | No shape risk. |
| `src/hooks/__tests__/useProfiles.test.tsx` | **MEDIUM** | `useProfiles.test.tsx:144-149` | `{profiles: [...], total: 1}` (legacy) | `{items, next_cursor, has_more, limit}` | `usePeers` hook unwraps to `response.items || []` (`useProfiles.ts:38-43`). Fixture hands back the old `{profiles, total}` envelope; the cache assertion at line 147 will fail because the hook returns `[]` (since `response.items` is undefined on the mock). **Must be updated to cursor envelope.** |
| `src/hooks/__tests__/useMapView.test.tsx` (second test) | **LOW** | `useMapView.test.tsx:55-65` | Already cursor-shaped | Same | No change. |
| `src/hooks/__tests__/useAuth.test.tsx` | **LOW** | `useAuth.test.tsx:1-200` | Mocks Supabase client + `auth.ts` helpers | n/a | Not affected. |
| `src/hooks/__tests__/useReports.test.tsx` | **LOW** | `useReports.test.tsx:1-50` | Single object | n/a | No change. |
| `src/hooks/__tests__/useShareCard.test.tsx` | **LOW** | `useShareCard.test.tsx:1-100` | Single object | n/a | No change. |
| `src/hooks/__tests__/useSocietyTags.test.tsx` | **LOW** | `useSocietyTags.test.tsx:1-50` | Single object | n/a | No change. |
| `src/hooks/__tests__/useProfileViews.test.tsx` | **LOW** | `useProfileViews.test.tsx:1-50` | Single object | n/a | No change. |
| `src/lib/__tests__/adapters.test.ts` | **LOW** | `adapters.test.ts:1-200` | Mocks single `Property`, `FlatmatesPeer`, `Visit`, `FlatmatesNotification`, `MessageOut` | n/a | No shape risk. Adapter tests are unit-level. |
| `src/lib/api/__tests__/client.test.ts` | **LOW** | `client.test.ts:1-280` | n/a | n/a | Pure URL builder / error mapper. |
| `src/lib/api/__tests__/errors.test.ts` | **LOW** | `errors.test.ts:1` | n/a | n/a | Pure error mapper. |
| `src/lib/api/__tests__/auth.test.ts` | **LOW** | `auth.test.ts:1` | n/a | n/a | Pure auth helper. |
| `src/hooks/__tests__/useKeyboardSwipe.test.tsx` | **LOW** | n/a | n/a | n/a | No API. |
| `src/hooks/__tests__/usePWA.test.tsx` | **LOW** | n/a | n/a | n/a | No API. |
| `src/hooks/__tests__/useResendTimer.test.tsx` | **LOW** | n/a | n/a | n/a | No API. |
| `src/hooks/__tests__/useFlatmatesRealtime.test.tsx` | **LOW** | n/a | n/a | n/a | Tests Supabase Broadcast invalidation, not REST. |

**Total: 6 fixtures need cursor-shape updates (useVisits, useProfiles, useSearch, useMapView, useConversations for messages-only, and the useProperties tests for any future change).** The rest are stable.

---

## D. E2E tests that may break

All e2e tests live in `e2e/`. They are mostly auth-redirect / page-structure smoke tests. Direct API call assertions are rare; the ones that mock or assert on list shape:

| File | API call(s) | New-shape break risk |
|------|-------------|----------------------|
| `e2e/auth-flow.spec.ts` | none directly (UI-level) | **NONE** — only checks page elements, redirect URLs, button text. |
| `e2e/chat-flow.spec.ts` | none directly | **NONE** — auth-redirect + loading-skeleton assertions. |
| `e2e/explore-flow.spec.ts` | `/app/explore` map renders | **LOW** — `MapView` uses `useMapView`; if `PropertyCursorPage` is correct, the pins render. |
| `e2e/search-flow.spec.ts` | `/discover` + `/search` (public) | **LOW** — only checks headings and chip text. |
| `e2e/visit-flow.spec.ts` | `/visits`, `/visits/[id]` | **LOW** — only checks redirect + empty state text. |
| `e2e/critical-flows.spec.ts` | **HIGH** — drives the full `discover → contact → OTP → onboarding → swipe → match → chat → visit → post → settings → admin` flow. Hard-codes the dialog `Sign in to continue` and many route paths. | **LOW for pagination** (no list-shape assertions) but **HIGH for new endpoints** — if any new payment or blog-preview step is introduced, this file must be updated. |
| `e2e/profile-interaction-flow.spec.ts` | `/app/profile/1` redirect | **NONE**. |
| `e2e/app-navigation.spec.ts` | exhaustively walks 18 protected routes | **LOW** — only checks redirect and headings. |
| `e2e/compatibility-flow.spec.ts` | `/app/compatibility/1` | **LOW** — only checks headings + progress-ring count. |
| `e2e/public-pages.spec.ts` | public SSG routes | **LOW** — no API. |

**Net e2e risk: minimal** for pagination migration. The risk moves to *integration* tests once the new endpoints (payments, blog preview, batch) are wired in.

---

## E. Page/component consumers

### E1. `src/pages/app/*`
| File | Component | Uses cursor pagination? | Notes |
|------|-----------|------------------------|-------|
| `HomePage.tsx` | `HomePage` | **Single-page** for `useWebSearch` (line 53), `usePeers` (line 65), `useSwipeDeck` (line 71) — all with `limit: 8`. | `limit: 8` keeps under the cap. No infinite scroll. |
| `ExplorePage.tsx` | `ExplorePage` | **Single-page** via `useMapView` (line 80). | `limit: 100` hard-coded in `useMapView.ts:48`. If the new contract caps lower, pins will be lost. |
| `SearchResults` consumers | see E3 | mixed | n/a |
| `VisitsPage.tsx` | `VisitsPage` | **Single-page** via `useVisits()` with no filters (line 322). | Client-side tab filter on entire array (`VisitsPage.tsx:39-66`). |
| `NotificationsPage.tsx` | `NotificationsPage` | **Single-page** via `useNotifications()` (line 13). | No infinite scroll. |
| `ChatDetailPage.tsx` | `ChatDetailPage` | **Infinite** via `useMessages` (line 35), with `fetchNextPage/hasNextPage/isFetchingNextPage` (lines 38-40). | Uses `before=` cursor (see A3). |
| `ChatsPage.tsx` | `ChatsPage` | **Single-page** via `useConversations()` (line 13). | No infinite scroll. |
| `LikesPage.tsx` | `LikesPage` | **Infinite** via `useIncomingLikesInfinite` (line 4). | Uses `PeopleGridPage` IntersectionObserver (line 50-60 in organism). |
| `MatchesPage.tsx` | `MatchesPage` | **Single-page** via `useMatches` (line 5). | No infinite scroll. |
| `SwipePage.tsx` | `SwipePage` | **Single-page** via `useSwipeDeck` (line 56). | Manual `refetch()` on near-end (line 92). |
| `ManagePage.tsx` | `ManagePage` | **Single-page** via `useMyProperties` (line 36). | Client-side status filter. |
| `DashboardPage.tsx` | `DashboardPage` | n/a (stats) | Single object via `useDashboardStats`. |
| `AnalyticsPage.tsx` | `AnalyticsPage` | n/a (single property) | Single object via `useListingAnalytics`. |
| `BlockedUsersPage.tsx` | `BlockedUsersPage` | **Single-page** via `useBlockedUsers` (line 15) — flat array, not cursor. | |
| `MyListingDetailPage.tsx` / `MyListingEditPage.tsx` | n/a | Single property via `useProperty(id)`. | |
| `AlertsPage.tsx` | `AlertsPage` | **Single-page** via `useSearchAlerts` (line 90). | |
| `SavedSearchesPage.tsx` | `SavedSearchesPage` | **Single-page** via `useSavedSearches` (line 99). | |
| `VisitDetailPage.tsx` | `VisitDetailPage` | n/a (single visit) | |
| `ProfilePage.tsx` / `ProfileEditPage.tsx` | n/a | Single object via `useMyProfile`. | |
| `PublicProfilePage.tsx` | `PublicProfilePage` | n/a (single profile) | |
| `CompatibilityPage.tsx` | `CompatibilityPage` | n/a (single breakdown) | |
| `Onboarding*Page.tsx` | n/a | No API; uses stores. | |
| `Settings*Page.tsx` | n/a | No list API. | |
| `LocationPage.tsx` / `ChooseRolePage.tsx` | n/a | No API. | |
| `PostPage.tsx` / `PostReviewPage.tsx` | n/a | Single property create via `useCreateProperty`. | |
| `HelpPage.tsx` / `ReportProblemPage.tsx` | n/a | No API. | |
| `AlertsPage.tsx` | `AlertsPage` | **Single-page** via `useSearchAlerts` (line 90). | |
| `VerifyPage.tsx` | `VerifyPage` | n/a (stub) | |
| `AppearancePage.tsx` | n/a | No API. | |

### E2. `src/pages/admin/*`
| File | Component | Pagination | Notes |
|------|-----------|------------|-------|
| `ModerationListingsPage.tsx` | `ModerationListingsPage` | **Infinite** via `useInfiniteAdminListings` (line 49). | Cursor-driven ✓. Flattens pages at line 63. |
| `ModerationReportsPage.tsx` | `ModerationReportsPage` | **Infinite** via `useInfiniteAdminReports` (line 48). | Cursor-driven ✓. Flattens pages at line 67. |
| `PrescreenPage.tsx` | `PrescreenPage` | n/a (single-listing detail) | |
| `AdminStatsPage.tsx` | `AdminStatsPage` | n/a (stats) | |
| `AdminLayout.tsx` | `AdminLayout` | n/a | |

### E3. `src/pages/public/*`
| File | Component | Pagination | Notes |
|------|-----------|------------|-------|
| `DiscoverPage.tsx` | `DiscoverPage` | **Single-page** via `useWebSearch(filters)` (line 71) with `limit: 20` (line 64). | URL still uses `page: 1` in `setParams` calls (lines 122, 143). |
| `SearchPage.tsx` | `SearchPage` | **Infinite** via `useInfiniteWebSearch` (line 80) with `limit: 20` (line 55). | URL still uses `page: 1` (lines 163, 167, 173, 186, 253, 265, 311, 434). Has IntersectionObserver at line 200+. |
| `CityPage.tsx` / `NeighborhoodPage.tsx` | n/a | n/a (SSG/SSR with hardcoded data) | |
| `BlogPage.tsx` | `BlogPage` | n/a — **fully static**, hardcoded `BLOG_POSTS` array at lines 9-67. | **No API consumer.** |
| `BlogPostPage.tsx` | `BlogPostPage` | n/a — **fully static**, hardcoded `BLOG_CONTENT` map at lines 17-93. | **No API consumer.** |
| `ListingDetailPage.tsx` | wraps `ListingDetailClient` | n/a | |
| `PublicLayout.tsx` | n/a | n/a | |
| `ComparisonPage.tsx` | n/a | n/a (useParams) | |
| `StatsPage.tsx` / `SemanticSearchPage.tsx` | wraps page-clients | n/a | |
| `AboutPage.tsx` / `PrivacyPage.tsx` / `TermsPage.tsx` / `NotFoundPage.tsx` / `ErrorPage.tsx` / `MaintenancePage.tsx` | n/a | n/a | |

### E4. `src/components/organisms/*` and `molecules/*` and `ui/*`
- `AppShell.tsx:114` — uses `useNotifications()` for the bell badge. Single-fetch, returns `FlatmatesNotification[]` after `response.items` unwrap. Counts unread client-side.
- `ChatThread.tsx` — pure presentational; receives `onLoadMore` from the page (line 113 in `ChatThread.tsx`, called from `ChatDetailPage.tsx:291`).
- `PeopleGridPage.tsx:50-60` — IntersectionObserver pattern; flattens `data.pages.flatMap(p => p.items)` for both regular and infinite queries. **Reusable ✓.**
- `SearchResults.tsx:50-65` — hard-codes `currentPage`/`totalPages` props and emits `onPageChange` (lines 51-54, 110-112, 117). **Pagination controls are page-numbered, not cursor-based. If the new contract drops `total_pages`, the `Previous/Next/Number` UI must be replaced with infinite-scroll.** Used in `SearchPage.tsx:200+` and `SemanticSearchClient.tsx:50+`. Risk: medium — visual only, but a `currentPage > totalPages` would render an empty paginator.
- `MapView.tsx` — uses `useMapView` indirectly via the `useMapView` hook data; pins render as `MapPin[]`.
- `SwipeDeck.tsx` — pure presentational; receives `profiles: SwipeProfile[]` from `SwipePage.tsx`.

---

## F. OpenAPI / type generation path

- **Command**: `npm run generate:api-types` → `openapi-typescript docs/flatmates-openapi.yaml -o src/lib/api/openapi-types.ts` (`package.json:16`).
- **Dev dependency**: `openapi-typescript@^7.10.1` (locked to `7.13.0` in `package-lock.json:43`).
- **Generated file**: `src/lib/api/openapi-types.ts` — **not present in the working tree** (no `openapi-types.ts` in `src/lib/api/`). It is also gitignored for lint (`eslint.config.mjs:28`).
- **Type source-of-truth**: hand-written files in `src/lib/api/*.types.ts` (see section B). The audit report (`.wiki/reference/data-models.md:7`) explicitly states: "the spec wins. This page documents the hand-written types". Effectively the runtime code does **not** import from the generated file; it imports from the barrel `@/lib/api/types`.
- **Spec staleness**: The spec at `docs/flatmates-openapi.yaml` (last modified `Jun 19 12:38`, 4259 lines) was grepped — **no matches** for `/payments`, `/webhooks`, `razorpay`, `webhook`, `batch-unswipe`, `batch-delete`, or `blog/posts/preview`. It still models the legacy `/flatmates/swipes` (line 303), `/flatmates/swipes/last` (line 342), and `/flatmates/likes?limit=&offset=` (lines 358-368) with `offset=` not `cursor=`. **It is stale relative to the new backend contract.** Risk: **HIGH** — the spec is the source of truth per the project conventions, and the spec was not updated when the backend migrated to cursor pagination + new endpoints.
- **Backend export**: There is no `app.yaml` (or `openapi.json`) currently committed in the backend tree. A `grep` for `app.yaml` was not run in this scan; the parent agent should verify. If the backend is going to ship a regenerated `docs/flatmates-openapi.yaml` post-merge, the Web must re-run `npm run generate:api-types` and decide whether to migrate the hand-written types to import from the generated file or keep them duplicated.

**Verdict**: The OpenAPI pipeline exists but is not load-bearing. The hand-written types already model the new shape correctly. The spec needs to be re-exported from the backend and re-committed to avoid drift. **No action needed in Web for type generation; the spec file in `docs/` is the artifact to refresh.**

---

## G. Missing endpoint coverage (Web has no client for these new backend endpoints)

A grep across `src/` for the new endpoint paths (`payments`, `webhook`, `swipes/batch-unswipe`, `upload/batch-delete`, `blog/posts`, `preview-token`, `razorpay`, `PaymentMethodOut`, `BlogPostStatus`) returns **zero matches in code** (only two matches in `TermsPage.tsx:73` and `BlogPostPage.tsx:79` for the word "payments" inside prose content).

| New backend endpoint | Web client | Risk |
|----------------------|------------|------|
| `POST /payments/*` (Razorpay) | **MISSING** | No `usePayments` hook, no `/billing` or `/checkout` page. **High**: if Payments is a deliverable for this batch, an entire new feature area is missing. |
| `POST /webhooks/auth/*` | **N/A (server-to-server)** | Correct — the Web does not consume webhooks. |
| `POST /swipes/batch-unswipe` | **MISSING** | Currently uses `DELETE /flatmates/swipes/last` (single undo, see `docs/flatmates-openapi.yaml:342`). Backend has a batch variant; the Web has no migration. Risk: low (single-undo is the only call site, in `SwipePage`). |
| `POST /upload/batch-delete` | **MISSING** | The Web does batch delete via N individual `DELETE /upload/{key}` calls (search `useImageUpload`). The batch endpoint would be a perf improvement, not a new feature. Risk: low. |
| `POST /blog/posts/{id}/preview-token` | **MISSING** | `BlogPage` and `BlogPostPage` are static (no API). No preview-token call site. Risk: low (if the blog is to be made dynamic, the entire `BlogPage`/`BlogPostPage` rewrite is the bigger task). |
| `GET /blog/posts/preview/{token}` | **MISSING** | Same as above. |
| `BlogPostStatus` enum | **MISSING** | No client code references the enum. |
| `PaymentMethodOut` / `RazorpayOrderResponse` types | **MISSING** | See section B — no `payments.types.ts` exists. |

---

## H. Top 10 highest-risk files (by blast radius)

| # | File | Why |
|---|------|-----|
| 1 | `src/hooks/queries/useConversations.ts` | Drives the chat (top-of-funnel, infinite-scroll, optimistic send). Currently uses `before=<msg_id>` cursor via `MessageListResponse` — if the new backend uses opaque `cursor=`, **the entire infinite message scroll breaks**. Touches: `ChatDetailPage`, `useSendMessage`, `useMessages`, `useMarkConversationRead`. |
| 2 | `src/hooks/queries/useSearch.ts` | Drives every public/discover/search page. `useInfiniteWebSearch` is the canonical cursor consumer; any change to the wire shape (e.g. `items` → `results`, or removal of `total`) ripples to `DiscoverPage`, `SearchPage`, `SemanticSearchClient`, `HomePage`, `SavedSearchesPage`, `AlertsPage`. |
| 3 | `src/hooks/queries/useProperties.ts` | Powers `useMyProperties` (single-fetch) and the `useUpdateProperty`/`useDeleteProperty` optimistic mutations. Room-poster flow (Post → Manage → Dashboard) flows through here. |
| 4 | `src/hooks/queries/useVisits.ts` | **Test fixture is on the legacy `{visits, total}` shape** (HIGH — see C). `VisitsPage` does client-side tab filtering on the entire in-memory list. Touches visit scheduling from `ChatDetailPage.handleScheduleVisit`. |
| 5 | `src/hooks/queries/useNotifications.ts` | Single-fetch `useNotifications` is the source of the bell badge in `AppShell`. Silent undercount if the contract moves to paginated. |
| 6 | `src/components/organisms/SearchResults.tsx` | Hard-codes `currentPage`/`totalPages` props and renders page-numbered Prev/Next. If the new contract drops `total_pages` (which it does — only `has_more` is emitted), the paginator is broken visually. |
| 7 | `docs/flatmates-openapi.yaml` | 4259 lines, stale (no `/payments`, no `/webhooks`, no batch endpoints, no `cursor=` params, still has `offset=` on `/flatmates/likes`). Source of truth per project conventions — the parent agent should re-export from the backend. |
| 8 | `src/hooks/queries/useMapView.ts` | Hard-codes `limit: 100` for the map viewport. If the new contract caps `limit` lower or requires `cursor` instead of `limit`, the map silently loses pins past the cap. |
| 9 | `src/hooks/queries/useAdmin.ts` | Dual-implemented single-fetch + infinite; optimistic updates in `useAdminModerate` and `useAdminReportAction` operate on **both** an `Array<T>` cache and an `InfiniteData<CursorPage<T>>` cache (lines 116-145, 268-294). Any shape drift breaks both. |
| 10 | `src/lib/schemas/search-params.ts` (`searchPageParams.page: parseAsInteger.withDefault(1)`, line 30; `discoverPageParams.page`, line 39) and `src/pages/public/SearchPage.tsx` + `src/pages/public/DiscoverPage.tsx` (URL `setParams({ page: 1 })` calls in 9+ locations) | The URL still uses `page=` as a 1-based integer; if the new contract uses cursor, the URL state should switch to `cursor=<string>`. **This is a deep-link break**: shared URLs from before the migration will 404 or reset. |

### Honourable mentions (not in the top 10 but worth tracking)
- `src/hooks/queries/useProfiles.ts` (test fixture on legacy `{profiles, total}` — see C)
- `src/hooks/queries/useBlocks.ts` (assumes flat `BlockedUser[]` from `/flatmates/blocks`)
- `src/pages/app/HomePage.tsx`, `SwipePage.tsx`, `ManagePage.tsx`, `BlockedUsersPage.tsx`, `AlertsPage.tsx`, `SavedSearchesPage.tsx`, `NotificationsPage.tsx`, `MatchesPage.tsx`, `ChatsPage.tsx`, `ExplorePage.tsx`, `DiscoverPage.tsx` — all are single-fetch today. The cursor migration is already in their hooks; the pages will simply not paginate until/unless infinite variants are added.

---

## Source coverage

Read end-to-end: 30+ files including all of `src/lib/api/*`, all of `src/hooks/queries/*`, all of `src/hooks/__tests__/*`, `src/lib/schemas/*`, `src/lib/stores/search-store.ts`, `src/lib/__tests__/adapters.test.ts`, `src/lib/api/__tests__/client.test.ts`, `package.json`, `e2e/auth-flow.spec.ts`, `e2e/chat-flow.spec.ts`, `e2e/explore-flow.spec.ts`, `e2e/search-flow.spec.ts`, `e2e/visit-flow.spec.ts`, `e2e/critical-flows.spec.ts`, `e2e/profile-interaction-flow.spec.ts`, `e2e/app-navigation.spec.ts`, `e2e/compatibility-flow.spec.ts`, `e2e/public-pages.spec.ts`, `docs/flatmates-openapi.yaml` (lines 1-500, 300-500 surveyed; full 4259-line file greps for `payments|webhook|swipes|upload|batch|blog`), representative pages: `HomePage`, `VisitsPage`, `NotificationsPage`, `ProfilePage`, `ExplorePage`, `SwipePage`, `ManagePage`, `DashboardPage`, `AnalyticsPage`, `BlockedUsersPage`, `ChatDetailPage`, `ChatsPage`, `LikesPage`, `MatchesPage`, `SavedSearchesPage`, `AlertsPage`, `PublicProfilePage`, `SearchPage`, `DiscoverPage`, `BlogPage`, `BlogPostPage`, plus the `AppShell`, `ChatThread`, `PeopleGridPage`, `SearchResults` organisms and the `SemanticSearchClient` page-client.

Read but not cited in detail: 15+ other pages under `src/pages/app/` and `src/pages/public/` — all confirmed to be either single-property / no-API consumers or to use one of the hooks inventoried above.
