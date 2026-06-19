# ADR-001: Wire-Protocol Divergences Between Web Client and OpenAPI Spec

- **Status:** Proposed — awaiting backend team decision
- **Date:** 2026-06-18
- **Authors:** Orchestrator audit (12 parallel sub-agents), consolidated by main agent
- **Source audits:** All 12 agent reports (2026-06-18), 200+ files read
- **Scope:** Every client/server contract mismatch the web-app audit found
- **Decision required by:** Before any client-side fix is applied to a divergent area

---

## 1. Context

The web app (`/Users/sakshammittal/Documents/360ghar/github/flatmates/360-flatmates-web`) and the backend (FastAPI at `/api/v1`, contract in `docs/flatmates-openapi.yaml`) have drifted in several places. The drift falls into three categories:

- **A. Wire format** — the client sends a different shape than the spec defines (e.g. enum values, date formats, response field shapes). Production traffic against the real backend will fail in predictable ways (422s, silent data loss, dropped events).
- **B. Surface area** — the spec defines endpoints the client never calls, or the client calls endpoints the spec does not document. Functional gaps that the user experiences as "broken" features.
- **C. Live-vs-spec** — the client imports/uses code that is dead on the web app, because the runtime path is the server endpoint. Maintenance liability and version-skew risk.

Per user directive ("flag divergences and stop"), no client code is changed in the divergent areas until the backend team picks a direction. Each divergence below has a proposed client fix and a blocking-impact callout.

**Convention used in this doc:** "Client" means the current state of the web app on `main`. "OpenAPI" means the contract in `docs/flatmates-openapi.yaml` at the path/line given. When the OpenAPI line is omitted, the spec was not reachable from the audit; treat as "needs backend verification."

---

## 2. Category A — Wire Format Divergences

### A-1. SSE event names (HIGHEST IMPACT)

The OpenAPI SSE event list (`docs/flatmates-openapi.yaml:1616`) and the client's listener list disagree. Events the client listens for but the spec does not document are silently dropped; events the spec defines have no listener.

| OpenAPI sends | Client listens for | File:line (client) | File:line (OpenAPI) | Impact |
|---|---|---|---|---|
| `new_notification` | `notification` | `src/lib/sse/types.ts:7`, `src/lib/sse/connection.ts:13` | `:1616` | Notification list & top-bar badge never refresh in real time |
| `visit_updated` | `visit_update` | `src/lib/sse/types.ts:9`, `src/lib/sse/connection.ts:15` | `:1616` | Visit detail page never updates after a peer reschedules/accepts |
| `new_match` | `new_match` | ✓ match | `:1616` | OK |
| `new_message` | `new_message` | ✓ match | `:1616` | OK |
| `conversation_updated` | `conversation_updated` | ✓ match | `:1616` | OK |
| `listing_status_changed` | `property_update` AND `listing_status_changed` | `src/lib/sse/types.ts:17`, `src/hooks/useSSE.ts:75-78` | `:1616` | Possibly OK; needs verification |
| (not in spec) | `message`, `swipe`, `profile_update`, `system`, `ping` | `src/lib/sse/connection.ts:12-25` | — | Wasted listeners; `system` invalidates `bootstrap` cache on phantom events |

**Proposed client fix:** Rename `notification` → `new_notification` and `visit_update` → `visit_updated` in `src/lib/sse/types.ts:7,9` and `src/lib/sse/connection.ts:13,15`, with matching `case` rename in `src/hooks/useSSE.ts:49-51, 67-69`. Drop the ungrounded listeners (`message`, `swipe`, `profile_update`, `system`, `ping`) or document the wire contract.

**Blocking impact:** P0. Real-time updates for notifications and visits are silently broken today.

**Backend decision needed:** Confirm the canonical event names. If the backend actually sends `notification` (not `new_notification`), update the OpenAPI spec to match.

---

### A-2. Admin report action enum (P0)

| Source | Values |
|---|---|
| Client (`src/lib/data/domain.ts:404-406`) | `["dismiss", "warn", "suspend"]` |
| OpenAPI (`docs/flatmates-openapi.yaml:3735-3737`) | `["dismiss", "warn_user", "suspend_user", "escalate"]` |

The client UI (`src/pages/admin/ModerationReportsPage.tsx:62-69`) sends `action: "warn"` and `action: "suspend"`. The backend will reject with 422.

**Proposed client fix:** Update `REPORT_ACTION_VALUES` to `["dismiss", "warn_user", "suspend_user", "escalate"]` and rewrite the UI labels in `src/pages/admin/ModerationReportsPage.tsx:94-110` (`actionLabels`, `actionPastTense`, `actionVariantMap`).

**Blocking impact:** P0. Every report action on a real backend fails.

---

### A-3. Admin report status enum (P1)

| Source | Values |
|---|---|
| Client (`src/lib/data/domain.ts:400-402`) | `["open", "under_review", "resolved", "dismissed"]` |
| OpenAPI (`docs/flatmates-openapi.yaml:4208-4210`) | `["open", "reviewed", "dismissed", "actioned"]` |

`ReportAdmin.status` (`src/lib/api/admin.types.ts:49`) is typed against the local enum, so any `reviewed` or `actioned` value from the backend fails TypeScript narrowing.

**Proposed client fix:** Reconcile to `["open", "reviewed", "dismissed", "actioned"]` and update `ReportFilters.status` in `src/hooks/queries/useAdmin.ts:72-83`. Add a status filter chip to `ModerationReportsPage.tsx`.

**Blocking impact:** P1. UI works against a stub backend but fails against the real contract.

---

### A-4. Listing lifecycle × moderation split (P2)

| Source | Model |
|---|---|
| OpenAPI (`docs/flatmates-openapi.yaml:4160-4169`) | `lifecycle: "draft\|active\|paused\|expired"` × `moderation: "pending_review\|approved\|rejected"` (two enums) |
| Client `propertySchema` (`src/lib/schemas/listing-builder.ts:122-123`) | Single `status` enum combining both |
| Client `RoomPosterDashboard.listings[*].status` (`src/lib/api/property.types.ts:152`) | `string` (loose) |

The detail page (`src/pages/app/MyListingDetailPage.tsx:19-22`) only knows `approved` and `pending_review`. A `paused` or `rejected` listing shows the default "Draft" label.

**Proposed client fix:** Split the type into `lifecycle: PropertyLifecycleStatus` and `moderation_status: PropertyModerationStatus` in `src/lib/api/property.types.ts` and `src/lib/schemas/listing-builder.ts`. Add a Pause/Resume action to `MyListingDetailPage.tsx:181-208`.

**Blocking impact:** P2. UI feature is incomplete; users cannot pause a listing via the UI today.

---

### A-5. Visit `scheduled_date` format (P1)

| Source | Format |
|---|---|
| Client `useUpdateVisit` mutation body (`src/hooks/queries/useVisits.ts:55-73`) | `YYYY-MM-DD` from `<input type="date">` |
| OpenAPI `VisitUpdate.scheduled_date` (`docs/flatmates-openapi.yaml:3041-3043`) | `format: date-time` |
| OpenAPI dedicated reschedule endpoint (`docs/flatmates-openapi.yaml:748-773`) | `POST /visits/{id}/reschedule` with `VisitReschedule { new_date: date-time, reason? }` |

The web app never calls the dedicated reschedule endpoint. It sends a date when the server expects a date-time, silently shifting to UTC midnight.

**Proposed client fix:** Add a `useRescheduleVisit(id)` hook calling `POST /visits/{id}/reschedule` with a full `date-time` value. Use a `datetime-local` input. Display `rescheduled_from` and `rescheduled_to` in the detail card.

**Blocking impact:** P1. Functional but lossy; reschedules land at midnight UTC, which in IST is 5:30 AM — wrong time-of-day.

---

### A-6. Visit status enum completeness (P2)

| Source | Values |
|---|---|
| `VisitCard.STATUS_LABEL` (`src/components/molecules/VisitCard.tsx:23-28`) | 4 entries: `confirmed`, `pending`, `completed`, `cancelled` |
| `domain.ts VisitStatus` (`src/lib/data/domain.ts:292-300`) | 5 entries: adds `reschedule_suggested` |

A visit in `reschedule_suggested` state shows the generic "Pending" badge — semantically wrong (it is awaiting the other party's confirmation of a new date).

**Proposed client fix:** Add `reschedule_suggested` to the card's `STATUS_LABEL` map and a distinct tone (e.g. "warning" yellow with "Awaiting their response" copy).

**Blocking impact:** P2. UX confusion, not data loss.

---

### A-7. Onboarding step count cap (P1)

| Source | Value |
|---|---|
| `ONBOARDING_STEPS.length` (`src/lib/stores/onboarding-store.ts:10-21`) | 10 |
| `onboarding_current_step` Zod cap (`src/lib/schemas/profile.ts:38`) | `.max(7)` |
| `onboardingStepSchema` (`src/lib/schemas/onboarding.ts:13`) | `.max(9)` |
| Profile ring denominator (`src/pages/app/ProfilePage.tsx:151`) | `... / 8` |

The Zod schema caps the server field at 7, but the store has 10 steps. The backend will reject `onboarding_current_step: 8` or `9`. The progress ring math is wrong.

**Proposed client fix:** Bump the schema cap to `.max(ONBOARDING_STEPS.length - 1)` (i.e. 9) and use `ONBOARDING_STEPS.length` in the progress ring. Add a `migrated` version to the persist key.

**Blocking impact:** P1. Steps 8 and 9 of onboarding cannot be persisted server-side.

---

### A-8. FlatmatesPeer PII surface (P0)

The peer response type includes PII the user has not opted into sharing:

| Field | File:line | Concern |
|---|---|---|
| `email` | `src/lib/api/user.types.ts:83-139` | All signed-in users can scrape every member's email |
| `phone_number` | same | Same |
| `non_negotiables` (incl. `gender_*_only`) | same | Culturally identifying in the Indian housing market |
| `has_pets` | same | Privacy |
| `party_habit` | same | Privacy |

**Proposed client fix (client-only):** Stop rendering these in `FlatmateProfileDetail` (`src/components/molecules/FlatmateProfileDetail.tsx:33-281`). Add a `?` placeholder where the value is hidden. Add per-field privacy toggles to `ProfileEditPage`. **The OpenAPI may or may not include these fields** — needs backend confirmation.

**Blocking impact:** P0 from a privacy/security perspective. **This is also a backend concern:** if the API returns these fields to non-match viewers, the backend must redact.

**Backend decision needed:** Confirm the API response shape. If PII is in the wire payload, server-side redaction is required for non-matches; otherwise the client cannot protect the user.

---

### A-9. `/share/:id` route promise (P0 for SEO)

60+ URLs in the sitemap (`public/sitemap.xml:243-272`) and `public/llms.txt:66` reference `/share/:id`. The route does not exist in `src/App.tsx`. Crawlers that follow the sitemap get 200/soft-404.

**Proposed client fix:** Add a `ShareListingPage` component and `/share/:id` route that renders the same `ListingDetailPage` content with `ogType="article"` and `canonicalUrl` pointing back to `/discover/{id}`. **Or** remove from sitemap + llms.txt.

**Blocking impact:** P0 for SEO. P1 for the user — any link sharing that resolves to a 404.

**Backend decision needed:** None if we add the client route. If removing, the sitemap is also wrong.

---

### A-10. `/complete-profile` route missing (P0)

`GateGuard` (`src/pages/guards.tsx:108`) redirects users with `authStage === "profile_completion"` to `/complete-profile`. No route is declared in `src/App.tsx`. The user lands on the 404 page.

**Proposed client fix:** Add a `<Route path="complete-profile" element={<ChooseRolePage />} />` (or a new dedicated page) under `GateGuard`.

**Blocking impact:** P0. This is a broken flow for every freshly-signed-up user.

---

### A-11. `PrescreenPage` calls wrong endpoint (P1)

`src/pages/admin/PrescreenPage.tsx:34` calls `useProperty(listingId)`, which hits the public `GET /properties/{id}` endpoint. The prescreen endpoint exists but is never invoked:

```yaml
# docs/flatmates-openapi.yaml:1827-1844
/flatmates/moderation/prescreen/{listing_id}:
  post:
    operationId: prescreenListing
```

**Proposed client fix:** Add a `usePrescreenListing(id)` mutation. Call it on mount and on a "Re-run pre-screen" button. Display the real `ai_prescreen_flags` from the response, not `property.tags`.

**Blocking impact:** P1. The page exists but doesn't do what its name promises.

---

### A-12. Nominatim User-Agent missing (P2)

`src/lib/api/nominatim.ts:11-17` fetches `nominatim.openstreetmap.org` from the browser with no User-Agent header, in violation of the Nominatim ToS. The endpoint may return 403 for many users.

**Proposed client fix (client-only, brittle):** Add a `User-Agent` header. **Proper fix:** proxy through the backend (`GET /geocode/reverse`).

**Backend decision needed:** Does the backend already have a geocoding proxy? If yes, switch the client to call it.

---

### A-13. Push infrastructure absent (P1)

`src/lib/push/fcm.ts:100-118` exports `requestAndRegisterPush`, called only in tests. No service worker `push` or `notificationclick` handler is registered. The `SettingsNotificationsPage` toggle is a placeholder.

**Proposed client fix:** Add SW handlers, wire the toggle, add a first-run prompt (e.g. on the second visit or after the first inbound message). This requires either VAPID public key in env (`VITE_VAPID_PUBLIC_KEY` is `.optional()`) or a server-provided public key.

**Blocking impact:** P1. The product ships with a "Push notifications" toggle that does nothing.

---

### A-14. Image upload is base64-in-JSON (P2)

`src/pages/app/ProfilePage.tsx:154-171` and `src/hooks/useImageUpload.ts:5-18` ship base64-encoded WebP in a PATCH body. No progress, no resumability, no `null` path for "remove photo." The 50MB-RAW fallback path can ship 50+ MB of base64.

**Proposed client fix:** New endpoint `POST /uploads/profile-image` (multipart) → returns CDN URL → PATCH with URL. Allow `profile_image_url: null` for remove.

**Backend decision needed:** Is there an upload endpoint, or do we need to add one? If yes, what's the contract?

---

### A-15. Phone-number length validation (P2)

`src/pages/app/ProfileEditPage.tsx:190-193` accepts 5 or 12 digits; only the server validates. The 5-digit input becomes `+9112345`.

**Proposed client fix:** Reject on client if `digits.length !== 10`.

**Blocking impact:** P2. The server catches it, but the UX is poor (round-trip + 422).

---

### A-16. Pagination response shape inconsistency (P2)

| Endpoint | Response shape |
|---|---|
| `PaginatedPropertyResponse` (`src/lib/api/property.types.ts:104-115`) | `{ properties, total, page, limit, total_pages, filters_applied, search_center }` |
| `VisitList` (`src/lib/api/visit.types.ts:63-66`) | `{ visits, total }` |
| `AdminListingsResponse` (`src/lib/api/admin.types.ts:33-38`) | `{ listings, total, limit, offset }` (uses `offset` not `page`) |
| `MessageListResponse` (`src/lib/api/conversation.types.ts:76-80`) | `{ messages, total, has_more }` (cursor-style) |
| `SwipeHistoryResponse` (`src/lib/api/search.types.ts:193-196`) | `{ history, total }` |
| `MatchesResponse` (`src/lib/api/match.types.ts:20-23`) | `{ matches, total }` |

The `useInfiniteQuery` page-merge logic in `useSearch.ts:124-129` only works for `PaginatedPropertyResponse` (which has `page`/`total_pages`).

**Proposed client fix:** Document the divergence. Build a `paginate(response)` adapter. Or standardize on `{ items, total, page, limit, total_pages, has_more }` server-side.

**Backend decision needed:** Standardize or document the divergence.

---

### A-17. `useMapView` ignores `clusters` (P2)

`src/hooks/queries/useMapView.ts:47-50` always returns `clusters: []`. The backend may return cluster data, but it's discarded.

**Proposed client fix:** Forward the cluster data and render in `MapView.tsx:81-123, 157-184`. Or remove the cluster UI if the backend doesn't return clusters.

**Backend decision needed:** Does the endpoint return clusters?

---

### A-18. `useSocietyTags` no list query (P1)

`src/hooks/queries/useSocietyTags.ts:14-29` defines only the vote mutation. No list query exists. Pages rendering `<SocietyTagVoteRow>` must maintain their own list state.

**Proposed client fix:** Add `useSocietyTags(listingId)` query. Wire optimistic updates into the vote mutation.

**Backend decision needed:** Confirm endpoint path and response shape.

---

### A-19. `CompatibilityBreakdown` schema drift (P2)

`CompatibilityBreakdown` in OpenAPI has `user_value`/`peer_value` as **required** strings. Client type `CompatibilityDimension` (`src/lib/api/match.types.ts:28-29`) makes them **optional**. Any strict server-side validation will differ.

**Proposed client fix:** Match OpenAPI (required) and surface missing values in the UI as a "what we couldn't compare" list.

---

### A-20. `RoomPosterDashboard.listings[*].status` typed as `string` (P2)

`src/lib/api/property.types.ts:152` types `status` as `string`. Should be `PropertyLifecycleStatus` per OpenAPI (`docs/flatmates-openapi.yaml:4165`).

**Proposed client fix:** Replace `string` with the proper enum.

---

### A-21. `flatmatesProfileSchema.budget_max` cap mismatch (P2)

| Source | Cap |
|---|---|
| `flatmatesProfileSchema.budget_max` (`src/lib/schemas/profile.ts:42-43`) | `min(0)` only (∞) |
| `onboardingBudgetTimelineFieldsSchema` (`src/lib/schemas/onboarding.ts:28-29`) | `min(0).max(100000)` |

Profile update allows any positive number; onboarding caps at 100,000.

**Proposed client fix:** Pick one cap and apply it consistently.

---

### A-22. `ListingAnalytics.period` includes `string` fallback (P2)

`src/lib/api/match.types.ts:163-164` includes `string` as a fallback. The OpenAPI has no enum.

**Proposed client fix:** Remove the `string` fallback or add it to the OpenAPI.

---

### A-23. `NotificationFilters` lacks `cursor` (P2)

`src/lib/api/notification.types.ts:20-25` uses limit/offset only. The OpenAPI may define cursor pagination.

**Proposed client fix:** Add `cursor?: string` if the spec defines it.

---

### A-24. `getAuthState` body type generic misleading (P3)

`src/lib/api/auth.ts:112-118` declares `TBody = { app: string }` on a GET request. The body is never sent on GET.

**Proposed client fix:** Use `TQuery = { app: string }` or drop the second generic.

---

### A-25. Visit `min` date string compare (P1)

`src/pages/app/VisitDetailPage.tsx:104-106` compares `YYYY-MM-DD` strings lexically. Works by coincidence for date-only values.

**Proposed client fix:** Parse with `new Date(...)` and compare.

---

## 3. Category B — Surface Area Divergences

### B-1. `useBlockUser` missing

`src/hooks/queries/useBlocks.ts:1-37` only exposes `useBlockedUsers` and `useUnblockUser`. `src/pages/app/ChatDetailPage.tsx:38-51` inlines its own mutation. The `Report a Problem` and `Block from public profile` flows have no shared contract.

**Proposed client fix:** Move the inline mutation into `useBlocks.ts` as `useBlockUser`. Reuse everywhere.

---

### B-2. `useSendMessage` ignores `attachment_url` UI

`src/lib/api/conversation.types.ts:46-51` defines `MessageCreate.attachment_url` and `message_type`. The hook at `src/hooks/queries/useConversations.ts:91-96` sends `payload.body` only. No file picker, no clipboard-paste, no drag-drop.

**Proposed client fix:** Build the attachment UI. Either proxy uploads through the backend or use a presigned-URL flow.

**Backend decision needed:** Attachment upload contract.

---

### B-3. Typing indicators / read receipts absent

`src/lib/stores/chat-store.ts:42-46` and `src/lib/sse/types.ts` (no `typing` / `message_read` event) — the wire is not defined.

**Proposed client fix:** Add a `typing` SSE event and a `message_read` event. Add a `<TypingBubble />` and a `<DeliveryCheck />` UI. Requires backend support.

**Backend decision needed:** Event names and payloads.

---

### B-4. Bulk actions on admin moderation

Neither `ModerationListingsPage` nor `ModerationReportsPage` has checkboxes or a bulk action bar. `SelectableCardGrid` exists in the design system but is unused.

**Proposed client fix:** Add bulk-approve / bulk-reject / bulk-dismiss. Requires backend bulk endpoint.

**Backend decision needed:** Bulk endpoint contract.

---

### B-5. Take-down of an approved listing

No path from `approved` → `rejected` in the UI. A listing that's been live for weeks and is now reported can't be removed via this surface.

**Proposed client fix:** Add a "Take down" action that creates a moderation action. Requires backend.

**Backend decision needed:** Confirm the action enum supports this transition.

---

### B-6. `Request Edit` moderation action

`MODERATION_ACTION_VALUES` includes `"request_edit"` (`src/lib/data/domain.ts:396`) and OpenAPI supports it (`docs/flatmates-openapi.yaml:3724-3726`). No UI surface.

**Proposed client fix:** Add a "Request Edit" button to the moderation row + a `RequestEditModal` that emails the owner.

**Backend decision needed:** Confirm notification flow when an edit is requested.

---

## 4. Category C — Live-vs-Spec Dead Code

### C-1. `lib/compatibility/*` is dead on the web

`src/lib/compatibility/{engine,dimensions,types,index}.ts` (entire directory) — not imported anywhere reachable from the rendered pages. The runtime path is the server endpoint `/flatmates/web/compatibility/{user_id}`.

**Proposed client fix:** Either adopt (use in the swipe deck to compute `match_percentage` locally for peer lists) or delete the directory.

**Backend decision needed:** None. The decision is internal to the web app.

---

### C-2. Hand-rolled PNG encoder

`src/lib/image-utils.ts:8-145` — 140 lines of CRC-32 + zlib + Adler-32 to produce a 4×4 solid-color PNG. Used as a placeholder for `NetworkImage`. Untested, brittle.

**Proposed client fix:** Replace with an inline base64 string per color, or precompute the four PNGs at build time. (Internal-only fix.)

---

### C-3. `MapExplorer.tsx`, `SearchResults.tsx`, `useShareCard.ts`

Not imported anywhere. Delete.

---

### C-4. `useAuth` collision

Two `useAuth` symbols: the hook file `src/hooks/useAuth.ts` and the inferred `useAuth` from `useStore(authStore, ...)`. Confusing.

**Proposed client fix:** Rename one or the other.

---

### C-5. `DashboardStats` unused type

`src/lib/api/admin.types.ts:76-84` defines `DashboardStats` but it's not imported anywhere. Either implement or delete.

---

### C-6. `setSidebar` / `setPalette` no-op guards missing

`src/lib/stores/ui-store.ts:103-104` always writes, even when the value is unchanged. Subscribers re-render. Internal fix.

---

### C-7. `setQueryData` followed by `invalidateQueries`

`src/hooks/queries/useProfiles.ts:71-73` does `setQueryData(...); invalidateQueries(...)`. The `invalidateQueries` immediately refetches the just-set data. Internal fix.

---

### C-8. `chatStore` is unused in app code

`src/lib/stores/chat-store.ts:1-49` — only the test imports it. Drafts are held in `useState` in `ChatThread.tsx:74` and lost on navigation.

**Proposed client fix:** Wire `chatStore` into `ChatThread` for draft persistence.

---

### C-9. Dead `line-2` token + unused semantic role aliases

`globals.css:29` defines `--color-line-2` (identical to `line-low` in light mode). The semantic role aliases at `globals.css:61-69` are never used.

**Proposed client fix:** Delete `line-2` and either adopt or delete the aliases.

---

### C-10. `setQueryData` "expire" semantics on `useConversations`

`src/hooks/queries/useConversations.ts:124` increments `total` heuristically. Internal fix.

---

## 5. Decisions Received (2026-06-18)

The orchestrator asked three questions to unblock the divergence work. Decisions:

### 5.1 — Wire-format divergences (A-1..A-25)

**Decision: Per-divergence review.** The orchestrator will present each A-* divergence individually for a C/S/D decision (Client-as-truth, Server-as-truth, Defer) before applying any fix. The per-divergence review is captured in `docs/adr/2026-06-18-a-divergence-decisions.md`.

### 5.2 — Surface-area divergences (B-1..B-6)

**Decision: All 6 blocked until backend defines the wire.** None of B-1..B-6 will be addressed in this pass. Follow-up tickets are filed in `docs/adr/follow-ups/2026-06-18-surface-area-blocked.md`.

| Item | Status | Follow-up |
|---|---|---|
| B-1 `useBlockUser` inlined | **Blocked — backend** | `follow-ups/2026-06-18-surface-area-blocked.md#b-1` |
| B-2 Attachment URL not sent | **Blocked — backend** | `follow-ups/2026-06-18-surface-area-blocked.md#b-2` |
| B-3 Typing / read receipts absent | **Blocked — backend** | `follow-ups/2026-06-18-surface-area-blocked.md#b-3` |
| B-4 Bulk actions | **Blocked — backend** | `follow-ups/2026-06-18-surface-area-blocked.md#b-4` |
| B-5 Take-down of approved listing | **Blocked — backend** | `follow-ups/2026-06-18-surface-area-blocked.md#b-5` |
| B-6 Request-edit moderation action | **Blocked — backend** | `follow-ups/2026-06-18-surface-area-blocked.md#b-6` |

### 5.3 — Dead code (C-1..C-10)

**Decision: Add to the doc.** None of the dead code is removed or adopted in this pass. Each item is recorded below with file:line and a recommendation for a follow-up pass.

| Item | Location | Recommendation | Status |
|---|---|---|---|
| C-1 `lib/compatibility/*` dead on web | `src/lib/compatibility/{engine,dimensions,types,index}.ts` | Adopt locally in swipe deck (compute `match_percentage` for peer lists without N+1 API calls) **or** delete | **Add to doc — follow-up** |
| C-2 Hand-rolled PNG encoder | `src/lib/image-utils.ts:8-145` | Replace with inline base64 or precompute at build time | **Add to doc — follow-up** |
| C-3 `MapExplorer.tsx`, `SearchResults.tsx`, `useShareCard.ts` unused | `src/components/organisms/{MapExplorer,SearchResults}.tsx`, `src/hooks/queries/useShareCard.ts` | Delete | **Add to doc — follow-up** |
| C-4 `useAuth` symbol collision | `src/hooks/useAuth.ts` vs `useStore(authStore, ...)` inferred | Rename one | **Add to doc — follow-up** |
| C-5 `DashboardStats` unused type | `src/lib/api/admin.types.ts:76-84` | Implement per-poster analytics **or** delete | **Add to doc — follow-up** |
| C-6 `setSidebar` / `setPalette` no-op guards | `src/lib/stores/ui-store.ts:103-104` | Add early-return for identical values | **Add to doc — follow-up** |
| C-7 `setQueryData` + `invalidateQueries` duplicate | `src/hooks/queries/useProfiles.ts:71-73` | Drop the `invalidateQueries` after `setQueryData` | **Add to doc — follow-up** |
| C-8 `chatStore` unused in app | `src/lib/stores/chat-store.ts:1-49` | Wire into `ChatThread` for draft persistence | **Add to doc — follow-up** |
| C-9 Dead `line-2` token + unused semantic role aliases | `src/styles/globals.css:29, 61-69` | Delete `line-2`; either adopt or delete the semantic aliases | **Add to doc — follow-up** |
| C-10 `useConversations` `total` increment heuristic | `src/hooks/queries/useConversations.ts:124` | Compute `total` deterministically from server response after success | **Add to doc — follow-up** |

---

## 6. Next Steps

1. **A per-divergence review** is now in progress. Each A-* is being presented individually for a C/S/D decision. The results will be recorded in `docs/adr/2026-06-18-a-divergence-decisions.md`.
2. **Once all A decisions are made**, the orchestrator dispatches 12 parallel fix agents (theme-partitioned, merge-safe) per the original plan.
3. **B-* and C-* follow-ups** are recorded in `docs/adr/follow-ups/` and `§5.3` above, respectively. They are out of scope for this pass.

After the decisions are in, the orchestrator will dispatch 12 parallel fix agents (theme-partitioned, merge-safe) per the original plan:

1. Public/Marketing + SEO
2. Auth + Onboarding
3. App Shell + Navigation + Layout
4. Discovery + Search + Map + Swipe
5. Post / Manage / Edit / Dashboard
6. Chats / Notifications / SSE
7. Visits + Compatibility
8. Profile + Settings + Safety
9. Admin + Moderation
10. State, API, Data Layer
11. Design System + Components
12. Cross-Cutting (a11y / perf / PWA / responsive / build)

Each agent is given a strict file:line scope and a list of items to fix from the audit. A final validation pass runs `npm run lint` and `npm run build` and verifies every fix is on disk.

---

## 7. Source

This ADR is the consolidated output of 12 parallel sub-agent reports run on 2026-06-18. All file:line references were extracted from the live codebase at that date.
