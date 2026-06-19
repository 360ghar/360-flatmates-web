# Wire-Protocol Divergence Tickets (A-1..A-25)

- **Date:** 2026-06-18
- **Source:** ADR-001 (`docs/adr/2026-06-18-wire-protocol-divergences.md`)
- **Decision pending:** Per-divergence C/S/D (Client-as-truth / Server-as-truth / Defer)
- **Format:** One ticket per divergence, with proposed client fix and recommendation

Each ticket has three possible decisions:

| Code | Meaning |
|---|---|
| **C** | Apply the proposed client fix. OpenAPI is the source of truth. |
| **S** | OpenAPI is wrong. Backend team updates the spec + implementation. Client freezes until then. |
| **D** | Defer. Known divergence, not blocking the user's current task. Revisit in a future pass. |

---

## A-1: SSE event names

**OpenAPI sends:** `new_notification`, `visit_updated`, `new_match`, `new_message`, `conversation_updated`, `listing_status_changed`
**Client listens for:** `notification`, `visit_update`, `new_match`, `new_message`, `conversation_updated`, `property_update`, `listing_status_changed`, plus ungrounded `message`, `swipe`, `profile_update`, `system`, `ping`

**File:line (client):** `src/lib/sse/types.ts:7,9`, `src/lib/sse/connection.ts:13,15`, `src/hooks/useSSE.ts:49-51, 67-69`
**File:line (OpenAPI):** `docs/flatmates-openapi.yaml:1616`

**Impact:** P0. Notification list & top-bar badge never refresh in real time. Visit detail page never updates after a peer reschedules/accepts.

**Proposed client fix:** Rename `notification` → `new_notification` and `visit_update` → `visit_updated` in `src/lib/sse/types.ts:7,9` and `src/lib/sse/connection.ts:13,15`, with matching `case` rename in `src/hooks/useSSE.ts:49-51, 67-69`. Drop ungrounded listeners or document the wire contract.

**Recommendation:** **C** — apply client fix. Matches the OpenAPI spec.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-2: Admin report action enum

**Client values:** `["dismiss", "warn", "suspend"]`
**OpenAPI values:** `["dismiss", "warn_user", "suspend_user", "escalate"]`

**File:line (client):** `src/lib/data/domain.ts:404-406`, `src/pages/admin/ModerationReportsPage.tsx:62-69`
**File:line (OpenAPI):** `docs/flatmates-openapi.yaml:3735-3737`

**Impact:** P0. Every report action on a real backend returns 422.

**Proposed client fix:** Update `REPORT_ACTION_VALUES` to `["dismiss", "warn_user", "suspend_user", "escalate"]` and rewrite UI labels in `ModerationReportsPage.tsx:94-110` (`actionLabels`, `actionPastTense`, `actionVariantMap`). Add an "Escalate" button.

**Recommendation:** **C** — apply client fix.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-3: Admin report status enum

**Client values:** `["open", "under_review", "resolved", "dismissed"]`
**OpenAPI values:** `["open", "reviewed", "dismissed", "actioned"]`

**File:line (client):** `src/lib/data/domain.ts:400-402`, `src/lib/api/admin.types.ts:49`, `src/hooks/queries/useAdmin.ts:72-83`
**File:line (OpenAPI):** `docs/flatmates-openapi.yaml:4208-4210`

**Impact:** P1. UI works against a stub backend but fails against the real contract.

**Proposed client fix:** Reconcile to `["open", "reviewed", "dismissed", "actioned"]`. Update `ReportFilters.status`. Add a status filter chip to `ModerationReportsPage.tsx`.

**Recommendation:** **C** — apply client fix.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-4: Listing lifecycle × moderation split

**OpenAPI model:** `lifecycle: "draft|active|paused|expired"` × `moderation: "pending_review|approved|rejected"` (two enums)
**Client model:** Single `status` enum combining both; `RoomPosterDashboard.listings[*].status: string` (loose)

**File:line (client):** `src/lib/schemas/listing-builder.ts:122-123`, `src/lib/api/property.types.ts:152`, `src/pages/app/MyListingDetailPage.tsx:19-22`
**File:line (OpenAPI):** `docs/flatmates-openapi.yaml:4160-4169`

**Impact:** P2. UI feature is incomplete; users cannot pause a listing via the UI today.

**Proposed client fix:** Split the type into `lifecycle` and `moderation_status`. Add a Pause/Resume action to `MyListingDetailPage.tsx:181-208`. Surface the `paused` state in the badge.

**Recommendation:** **C** — apply client fix. Improves feature completeness.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-5: Visit `scheduled_date` format

**Client sends:** `YYYY-MM-DD` from `<input type="date">` via `useUpdateVisit`
**OpenAPI expects:** `format: date-time`
**Dedicated endpoint exists but unused:** `POST /visits/{id}/reschedule` with `VisitReschedule { new_date: date-time, reason? }`

**File:line (client):** `src/hooks/queries/useVisits.ts:55-73`, `src/pages/app/VisitDetailPage.tsx:185-205`
**File:line (OpenAPI):** `docs/flatmates-openapi.yaml:748-773, 3041-3043`

**Impact:** P1. Reschedules land at UTC midnight, which in IST is 5:30 AM — wrong time-of-day.

**Proposed client fix:** Add `useRescheduleVisit(id)` hook calling the dedicated endpoint with a full `date-time` value. Use a `datetime-local` input. Display `rescheduled_from` and `rescheduled_to` in the detail card.

**Recommendation:** **C** — apply client fix.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-6: Visit status enum completeness

**Client `VisitCard.STATUS_LABEL`:** 4 entries: `confirmed`, `pending`, `completed`, `cancelled`
**Domain `VisitStatus`:** 5 entries: adds `reschedule_suggested`

**File:line (client):** `src/components/molecules/VisitCard.tsx:23-28`, `src/lib/data/domain.ts:292-300`

**Impact:** P2. UX confusion — `reschedule_suggested` visits show the wrong badge.

**Proposed client fix:** Add `reschedule_suggested` to the card's `STATUS_LABEL` map with a distinct tone (warning yellow, "Awaiting their response" copy).

**Recommendation:** **C** — apply client fix. Pure UI work.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-7: Onboarding step count cap

**ONBOARDING_STEPS.length:** 10
**onboarding_current_step Zod cap:** `.max(7)`
**onboardingStepSchema Zod cap:** `.max(9)`
**Profile ring denominator:** `... / 8`

**File:line (client):** `src/lib/schemas/profile.ts:38`, `src/lib/schemas/onboarding.ts:13`, `src/pages/app/ProfilePage.tsx:151`
**File:line (store):** `src/lib/stores/onboarding-store.ts:10-21`

**Impact:** P1. Steps 8 and 9 of onboarding cannot be persisted server-side. Progress ring is wrong.

**Proposed client fix:** Bump the schema cap to `.max(ONBOARDING_STEPS.length - 1)` and use `ONBOARDING_STEPS.length` in the progress ring. Add a `migrated` version to the persist key.

**Recommendation:** **C** — apply client fix.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-8: FlatmatesPeer PII surface (HIGHEST PRIVACY IMPACT)

**Client type includes PII on the wire:** `email`, `phone_number`, `non_negotiables`, `has_pets`, `party_habit`
**OpenAPI may or may not include these fields** — needs backend verification

**File:line (client):** `src/lib/api/user.types.ts:83-139`, `src/components/molecules/FlatmateProfileDetail.tsx:33-281`

**Impact:** P0 from a privacy/security perspective. **Backend concern:** if the API returns these fields to non-match viewers, server-side redaction is required.

**Proposed client fix (defensive):** Stop rendering PII in `FlatmateProfileDetail`. Add per-field privacy toggles to `ProfileEditPage`. Mark fields as `"hidden"` in the wire payload.

**Recommendation:** **D** (defer) until the backend team confirms what the API returns. The client fix is unsafe until then — if the API does return PII, the client must not trust the field, but if the API doesn't, the client fix is no-op. This is a security call.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-9: `/share/:id` route missing

**Sitemap/llms.txt promise:** 60+ URLs reference `/share/:id`
**Route in `src/App.tsx`:** does not exist

**File:line (sitemap):** `public/sitemap.xml:243-272`
**File:line (llms.txt):** `public/llms.txt:66`

**Impact:** P0 for SEO. P1 for the user — any link sharing that resolves to a 404.

**Proposed client fix:** Add `ShareListingPage` and `/share/:id` route that renders `ListingDetailPage` with `ogType="article"` and `canonicalUrl` pointing to `/discover/{id}`. **Or** remove from sitemap + llms.txt.

**Recommendation:** **C** — add the route. Pure client work.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-10: `/complete-profile` route missing

**GateGuard redirects to:** `/complete-profile`
**Route in `src/App.tsx`:** does not exist

**File:line (client):** `src/pages/guards.tsx:108`, `src/pages/app/ChooseRolePage.tsx`, `src/App.tsx:158`

**Impact:** P0. Users with `authStage === "profile_completion"` land on the 404 page.

**Proposed client fix:** Add `<Route path="complete-profile" element={<ChooseRolePage />} />` under `GateGuard`. Or create a new dedicated `CompleteProfilePage` if the mode-picker isn't enough.

**Recommendation:** **C** — apply client fix. Pure client work.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-11: `PrescreenPage` calls wrong endpoint

**Page calls:** `useProperty(listingId)` → public `GET /properties/{id}`
**Real endpoint exists:** `POST /flatmates/moderation/prescreen/{listing_id}` (`docs/flatmates-openapi.yaml:1827-1844`)

**File:line (client):** `src/pages/admin/PrescreenPage.tsx:34, 308-323`
**File:line (OpenAPI):** `docs/flatmates-openapi.yaml:1827-1844`

**Impact:** P1. The page exists but doesn't do what its name promises.

**Proposed client fix:** Add `usePrescreenListing(id)` mutation. Call it on mount and on a "Re-run pre-screen" button. Display the real `ai_prescreen_flags`, not `property.tags`.

**Recommendation:** **C** — apply client fix.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-12: Nominatim User-Agent missing

**Client fetches:** `nominatim.openstreetmap.org` from browser with no User-Agent header
**Nominatim ToS:** requires User-Agent

**File:line (client):** `src/lib/api/nominatim.ts:11-17`

**Impact:** P2. Endpoint may return 403 for many users.

**Proposed client fix (client-only):** Add `User-Agent` header.
**Proper fix:** proxy through the backend (`GET /geocode/reverse`).

**Recommendation:** **C** (client-only fix) **or D** (proper backend fix). Mark as defer if backend work is preferred.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-13: Push infrastructure absent

**Client state:** `requestAndRegisterPush` is exported but only used in tests. No service worker `push` or `notificationclick` handler is registered.

**File:line (client):** `src/lib/push/fcm.ts:100-118`, `src/pages/app/SettingsNotificationsPage.tsx:19`, `src/lib/env.ts:7`
**File:line (OpenAPI):** VAPID public key contract is undefined.

**Impact:** P1. The product ships with a "Push notifications" toggle that does nothing.

**Proposed client fix:** Requires VAPID public key from backend (or shared env). Add SW handlers, wire the toggle, add a first-run prompt.

**Recommendation:** **D** — defer until backend provides the VAPID public key contract. (Or **S** if the backend team can confirm the existing key in `env.ts:7` is canonical.)

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-14: Image upload is base64-in-JSON

**Client state:** PATCH body contains base64-encoded WebP. No `null` path for "remove photo."

**File:line (client):** `src/pages/app/ProfilePage.tsx:154-171`, `src/hooks/useImageUpload.ts:5-18`

**Impact:** P2. 50MB-RAW fallback path can ship 50+ MB of base64 in a PATCH. No "remove photo" flow.

**Proposed client fix:** New endpoint `POST /uploads/profile-image` (multipart) → returns CDN URL → PATCH with URL. Allow `profile_image_url: null` for remove.

**Recommendation:** **D** — defer until backend provides the upload endpoint. The client-only fix (base64→multipart) is impossible without an endpoint.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-15: Phone-number length validation

**Client state:** `src/pages/app/ProfileEditPage.tsx:190-193` accepts 5 or 12 digits.

**Impact:** P2. Server catches it, but the UX is poor (round-trip + 422).

**Proposed client fix:** Reject on client if `digits.length !== 10`.

**Recommendation:** **C** — apply client fix. Pure UX work.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-16: Pagination response shape inconsistency

**Current state:** Six different response shapes across the API (see ADR-001 §A-16 for full table).

**File:line (client):** `src/lib/api/{property,visit,admin,conversation,search,match}.types.ts`

**Impact:** P2. `useInfiniteQuery` page-merge logic in `useSearch.ts:124-129` only works for `PaginatedPropertyResponse`.

**Proposed client fix:** Document the divergence. Build a `paginate(response)` adapter. Or **S** — server standardizes on `{ items, total, page, limit, total_pages, has_more }`.

**Recommendation:** **D** — defer until backend decides the standard.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-17: `useMapView` ignores `clusters`

**Client state:** `src/hooks/queries/useMapView.ts:47-50` always returns `clusters: []`.

**Impact:** P2. Backend may return cluster data, but it's discarded.

**Proposed client fix:** Forward cluster data and render in `MapView.tsx:81-123, 157-184`. Or **S** — confirm the backend doesn't return clusters.

**Recommendation:** **C** (render if backend returns) or **D** (defer until backend confirms).

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-18: `useSocietyTags` no list query

**Client state:** Only the vote mutation exists. No list query.

**File:line (client):** `src/hooks/queries/useSocietyTags.ts:14-29`

**Impact:** P1. Pages rendering `<SocietyTagVoteRow>` must maintain their own list state.

**Proposed client fix:** Add `useSocietyTags(listingId)` query. Wire optimistic updates into the vote mutation.

**Recommendation:** **D** — confirm endpoint path and response shape with backend first.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-19: `CompatibilityBreakdown` schema drift

**OpenAPI:** `user_value`/`peer_value` are required strings
**Client type:** optional

**File:line (client):** `src/lib/api/match.types.ts:28-29`

**Impact:** P2. Strict server-side validation will differ.

**Proposed client fix:** Match OpenAPI (required) and surface missing values in the UI as a "what we couldn't compare" list.

**Recommendation:** **C** — apply client fix.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-20: `RoomPosterDashboard.listings[*].status` typed as `string`

**File:line (client):** `src/lib/api/property.types.ts:152`
**File:line (OpenAPI):** `docs/flatmates-openapi.yaml:4165`

**Impact:** P2. Type safety loss.

**Proposed client fix:** Replace `string` with `PropertyLifecycleStatus`.

**Recommendation:** **C** — apply client fix.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-21: `flatmatesProfileSchema.budget_max` cap mismatch

**Profile update:** `min(0)` only (∞)
**Onboarding cap:** `min(0).max(100000)`

**File:line (client):** `src/lib/schemas/profile.ts:42-43`, `src/lib/schemas/onboarding.ts:28-29`

**Impact:** P2. Inconsistent validation between flows.

**Proposed client fix:** Pick one cap and apply it consistently. **Or** S — backend dictates the cap.

**Recommendation:** **D** — defer until backend defines the canonical cap.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-22: `ListingAnalytics.period` includes `string` fallback

**File:line (client):** `src/lib/api/match.types.ts:163-164`

**Impact:** P2. Looser than the typed enum.

**Proposed client fix:** Remove the `string` fallback or add it to the OpenAPI.

**Recommendation:** **C** — apply client fix (remove the `string`).

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-23: `NotificationFilters` lacks `cursor`

**File:line (client):** `src/lib/api/notification.types.ts:20-25`

**Impact:** P2. OpenAPI may define cursor pagination that the client doesn't support.

**Proposed client fix:** Add `cursor?: string` if the spec defines it.

**Recommendation:** **D** — defer until backend confirms pagination model.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-24: `getAuthState` body type generic misleading

**File:line (client):** `src/lib/api/auth.ts:112-118`

**Impact:** P3. Misleading type annotation; no runtime impact.

**Proposed client fix:** Use `TQuery = { app: string }` or drop the second generic.

**Recommendation:** **C** — apply client fix. Pure type cleanup.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## A-25: Visit `min` date string compare

**File:line (client):** `src/pages/app/VisitDetailPage.tsx:104-106`

**Impact:** P1. Works by coincidence for date-only values; fragile to TZ changes.

**Proposed client fix:** Parse with `new Date(...)` and compare. Or use a date-fns `isBefore`.

**Recommendation:** **C** — apply client fix. Pure UX work.

**Decision:** ⬜ C / ⬜ S / ⬜ D

---

## Summary Table (to be filled in)

| # | Title | Impact | Recommendation | Decision |
|---|---|---|---|---|
| A-1 | SSE event names | P0 | C | |
| A-2 | Admin report action enum | P0 | C | |
| A-3 | Admin report status enum | P1 | C | |
| A-4 | Listing lifecycle × moderation split | P2 | C | |
| A-5 | Visit `scheduled_date` format | P1 | C | |
| A-6 | Visit status enum completeness | P2 | C | |
| A-7 | Onboarding step count cap | P1 | C | |
| A-8 | FlatmatesPeer PII surface | P0 | D | |
| A-9 | `/share/:id` route missing | P0 | C | |
| A-10 | `/complete-profile` route missing | P0 | C | |
| A-11 | `PrescreenPage` calls wrong endpoint | P1 | C | |
| A-12 | Nominatim User-Agent missing | P2 | C/D | |
| A-13 | Push infrastructure absent | P1 | D | |
| A-14 | Image upload is base64-in-JSON | P2 | D | |
| A-15 | Phone-number length validation | P2 | C | |
| A-16 | Pagination response shape inconsistency | P2 | D | |
| A-17 | `useMapView` ignores `clusters` | P2 | C/D | |
| A-18 | `useSocietyTags` no list query | P1 | D | |
| A-19 | `CompatibilityBreakdown` schema drift | P2 | C | |
| A-20 | `RoomPosterDashboard.listings[*].status` typed as `string` | P2 | C | |
| A-21 | `flatmatesProfileSchema.budget_max` cap mismatch | P2 | D | |
| A-22 | `ListingAnalytics.period` includes `string` fallback | P2 | C | |
| A-23 | `NotificationFilters` lacks `cursor` | P2 | D | |
| A-24 | `getAuthState` body type generic misleading | P3 | C | |
| A-25 | Visit `min` date string compare | P1 | C | |
