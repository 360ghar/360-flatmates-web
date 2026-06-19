# 360 Flatmates — Full Audit Findings

**Date:** 2026-06-18
**Method:** 12 parallel sub-agents (read + write), each with a strict file:line scope
**Source:** 200+ files across `src/`, `plans/`, `docs/`, `public/`, `scripts/`

---

## Summary

| Agent | Scope | Status | Fixes Applied | Items Skipped |
|-------|-------|--------|---------------|---------------|
| F1 | Public/Marketing + SEO | ✅ Complete | 20 | 3 |
| F2 | Auth + Onboarding | ✅ Complete | 21 | 4 |
| F3 | App Shell + Navigation + Layout | ❌ Cancelled | 0 | — |
| F4 | Discovery + Search + Map + Swipe | ❌ Cancelled | 0 | — |
| F5 | Post / Manage / Edit / Dashboard | ✅ Complete | 17 | 5 |
| F6 | Chats / Notifications / SSE | ✅ Complete | 19 | 3 |
| F7 | Visits + Compatibility | ✅ Complete | 22 | 3 |
| F8 | Profile + Settings + Safety | ❌ Cancelled | 0 | — |
| F9 | Admin + Moderation | ❌ Cancelled | 0 | — |
| F10 | State, API, Data Layer | ✅ Complete | 15 | 17 |
| F11 | Design System + Components | ✅ Complete | 16 | 30 |
| F12 | Cross-Cutting (a11y/perf/PWA/build) | ✅ Complete | 12 | 21 |

**Total fixes applied: 142**
**Total items skipped (with reasons): 86**

---

## Wire-Protocol Divergences (ADR-001)

**File:** `docs/adr/2026-06-18-wire-protocol-divergences.md`
**Tickets:** `.todo/wire-protocol-divergences.md`
**Follow-ups:** `docs/adr/follow-ups/2026-06-18-surface-area-blocked.md`

25 wire-format divergences (A-1..A-25), 6 surface-area divergences blocked on backend (B-1..B-6), 10 dead-code items added to doc (C-1..C-10). All are paused pending per-divergence review.

---

## F1 — Public/Marketing + SEO (20 fixes)

| # | Fix | File:Line |
|---|-----|-----------|
| 1 | Noindex on /search pages | `SearchPage.tsx:208`, `SemanticSearchPage.tsx:18` |
| 2 | Removed invalid `"@type": "City"` schema | `CityPage.tsx:84-93, 124` |
| 3 | Residence schema: city validation + PriceSpecification | `lib/seo/schema.ts:286-347` |
| 4 | Dark-mode `theme-color` meta (media-query split) | `index.html:7-8` |
| 5 | Plausible dedupe comment | `index.html:90-94` |
| 6 | `focusRing` on Error/Maintenance pages | `ErrorPage.tsx:4,26,32`, `MaintenancePage.tsx:4,25` |
| 7 | 3rd testimonial (Ananya S., 89%) | `landing-data.ts:188-194`, `TestimonialsSection.tsx:24` |
| 8 | HeroSection `NetworkImage` (was raw `<img>`) | `HeroSection.tsx:10, 24-33` |
| 9 | BottomCTA dark-mode gradient | `BottomCTA.tsx:12-14` |
| 10 | FAQAccordion `h-4.5` → `h-[18px]` | `FAQAccordion.tsx:27` |
| 11 | `text-display` clamp dead in 7 sections — removed overrides | `FeatureBento.tsx:84`, `TestimonialsSection.tsx:19`, `HowItWorks.tsx:17`, `CitiesShowcase.tsx:18`, `CompatibilitySection.tsx:26`, `BottomCTA.tsx:23`, `FAQAccordion.tsx:13` |
| 12 | TrustStrip 86% stat animated via `CountStat` | `TrustStrip.tsx:15, 51` |
| 13 | Sitemap `lastmod` contract comment | `scripts/prerender.ts:19-30`, `scripts/generate-sitemap.ts:236-242` |
| 14 | `/share/:id` TODO (blocked on A-9) | `scripts/generate-sitemap.ts:244-260`, `public/llms.txt:65-66` |
| 15 | SEO meta descriptions expanded | `AboutPage.tsx:40`, `TermsPage.tsx:73`, `PrivacyPage.tsx:68`, `StatsPage.tsx:11` |
| 16 | `og:image:alt` on default og-image | `SeoHelmet.tsx:84-86,117`, `index.html:25` |

---

## F2 — Auth + Onboarding (21 fixes)

| # | Fix | File:Line |
|---|-----|-----------|
| 1 | Email/phone format gate before `checkIdentifierStatus` | `LoginPage.tsx:31-38, 202-215` |
| 2 | `AbortController` on `checkIdentifierStatus` | `LoginPage.tsx:113, 217-261` |
| 3 | Apple detection tightened (excludes Chrome/Edge on iOS) | `LoginPage.tsx:120-140` |
| 4 | "Use a different identifier" link on set-password step | `LoginPage.tsx:635-697` |
| 5 | `?identifier=...` URL param seeded on OTP step | `LoginPage.tsx:70-77, 247-252, 432-445` |
| 6 | `?error=auth` cleared from URL on first render | `LoginPage.tsx:91-109` |
| 7 | Shared `_password-policy.ts` module | `pages/auth/_password-policy.ts` (new) |
| 8 | `PasswordInput helperText` wired (aria-describedby) | `LoginPage.tsx:660-669`, `ForgotPasswordPage.tsx:299-314` |
| 9 | 10s timeout on `exchangeCodeForSession` | `AuthCallbackPage.tsx:11-30, 82-103` |
| 10 | `onError` toasts on onboarding mutations | `OnboardingStepContent.tsx:162-175` |
| 11 | `isLastStep` derived from `stepKey` (deep-link safety) | `OnboardingStepContent.tsx:196-202` |
| 12 | `ChooseRolePage` differentiated error types | `ChooseRolePage.tsx:10, 49-84` |
| 13 | `VerifyPage` marked as PLACEHOLDER | `VerifyPage.tsx:8-18` |
| 14 | `Number("")` / `Number("abc")` guarded on age input | `OnboardingStepContent.tsx:288-304` |
| 15 | Client-side `min > max` budget check | `OnboardingStepContent.tsx:117-128` |
| 16 | "Start over" button in onboarding | `OnboardingStepContent.tsx:187-193, 576-586` |
| 17 | Splash-step CTA `aria-label="Get started"` | `OnboardingStepContent.tsx:202, 562-569` |
| 18 | `useResendTimer` failure documentation | `useResendTimer.ts:67-73` |
| 19 | `useWebOtp` failure documentation | `useWebOtp.ts:58-67` |

---

## F3 — App Shell + Navigation + Layout (CANCELLED)

**Status:** Agent was cancelled. No fixes applied.

**Pending items from audit:**
- Safe-area-inset on 4 sticky headers + footer
- Sidebar drag-handle full gesture support
- `min-h-dvh` on root
- Modal a11y (scroll lock, inert, focus trap)
- PublicLayout drawer close-on-route + Escape
- Mode-based nav completeness
- OfflineBanner mount
- PWA install for unauthenticated visitors
- iPadOS detection
- Sidebar-only items accessible on mobile
- Top bar `title` slot wiring
- Admin layout `id="main"`

---

## F4 — Discovery + Search + Map + Swipe (CANCELLED)

**Status:** Agent was cancelled. No fixes applied.

**Pending items from audit:**
- State-during-render anti-pattern in SearchPage
- URL→store write causing cross-surface leak
- Map ignores most filter fields
- SwipeDeck dual `animating` flag fix
- Keyboard hook scope
- Match celebration 8s→4s
- HomePage SearchBar wiring
- Quick-filter invalid sort
- useMatches staleTime
- MapView cluster keyboard a11y
- Dark-mode tile flip
- SwipeDeck first-time hint overlay
- Scroll-to-top on filter change

---

## F5 — Post / Manage / Edit / Dashboard (17 fixes)

| # | Fix | File:Line |
|---|-----|-----------|
| 1 | Multi-step form draft: persist `currentStep` + use canonical key | `PostPage.tsx:13,53-86,131-157` |
| 2 | `pendingImages` TODO | `PostPage.tsx:137-140` |
| 3 | Validation gaps (steps 2-7 + `Number.isFinite`) | `PostPage.tsx:88-129,388-401,469-490` |
| 4 | `useDirtyFormGuard` hook (new) | `hooks/useDirtyFormGuard.ts` (new) |
| 5 | Photo grid parity (delete + set-as-main) in Edit | `MyListingEditPage.tsx:308-358` |
| 6 | `["dashboard"]` invalidation on update/renew/create | `useProperties.ts:55-56,113,138,164,189` |
| 7 | `useDeleteProperty` clears single-property cache | `useProperties.ts:188` |
| 8 | Optimistic updates on update/delete | `useProperties.ts:69-184` |
| 9 | `PROPERTY_STATUS_LABEL` extended | `MyListingDetailPage.tsx:19-29` |
| 10 | `localISODate` (replaces UTC `toIsoDate`) | `MyListingDetailPage.tsx:35-37,85` |
| 11 | Boost + Renew confirmation modals | `MyListingDetailPage.tsx:53-54,204-211,253-289` |
| 12 | Decorative trend arrow removed | `DashboardPage.tsx:21-48` |
| 13 | Dashboard mobile card `min-w-0` | `DashboardPanel.tsx:140-180` |
| 14 | ManagePage status filter + sort | `ManagePage.tsx` (rewritten) |
| 15 | Analytics `Number.isFinite` guard | `AnalyticsPage.tsx:108` |
| 16 | Analytics default `period=30d` | `AnalyticsPage.tsx:77-91` |

---

## F6 — Chats / Notifications / SSE (19 fixes)

| # | Fix | File:Line |
|---|-----|-----------|
| 1 | `useMessages` → `useInfiniteQuery` (cursor-based) | `useConversations.ts:54-78` |
| 2 | Temp-id counter → `useRef` (per-tab) | `useConversations.ts:111` |
| 3 | `onSuccess` dedup + stable `created_at` sort | `useConversations.ts:171-201` |
| 4 | `useMarkConversationRead` hook (new) | `useConversations.ts:237-261` |
| 5 | Mark-read invoked on mount + visibility | `ChatDetailPage.tsx:73-90` |
| 6 | Primary heartbeat every 10s + liveness re-elect | `broadcast.ts:1-68, 230-322` |
| 7 | `disconnected` prop wired to ChatThread | `ChatDetailPage.tsx:33, 288` |
| 8 | `EmptyState` replaces bare `<p>` in Notifications | `NotificationsPage.tsx:108-112` |
| 9 | `IntersectionObserver` auto-read after 1.5s | `NotificationsPage.tsx:35-69, 158-170` |
| 10 | `actionLabel`/`onAction` slot on NotificationCard | `NotificationCard.tsx:36-43, 100-117` |
| 11 | Notifications grouped by date bucket | `NotificationsPage.tsx:18-43, 138-176` |
| 12 | Mark-all-read success toast | `NotificationsPage.tsx:91-99` |
| 13 | `setQueriesData` flip for mark-read (no refetch) | `useNotifications.ts:31-86` |
| 14 | Optimistic rollback on send failure | `useConversations.ts:161-169`, `ChatDetailPage.tsx:61-66, 107-126` |
| 15 | `<Check>` icon for `status === "sent"` | `ChatMessageBubble.tsx:2, 60-62` |
| 16 | IME composition guard on Enter-to-send | `ChatThread.tsx:358-371` |
| 17 | Pre-mark-read on conversation open | `ChatsPage.tsx:20-25` |
| 18 | SSE singleton re-instantiation race documented | `useSSE.ts:140-146` |
| 19 | Relay handler reset on unmount | `useSSE.ts:158-170`, `broadcast.ts:107-114` |

**Known regression:** `src/hooks/__tests__/useConversations.test.tsx` needs updating for the new `useInfiniteQuery` API.

---

## F7 — Visits + Compatibility (22 fixes)

| # | Fix | File:Line |
|---|-----|-----------|
| 1 | `reschedule_suggested` status in VisitCard | `VisitCard.tsx:10-43, 105-117` |
| 2 | `canTransition(from, to)` guard | `useVisits.ts:39-58, 113-128` |
| 3 | Hide duplicate buttons on embedded card | `VisitDetailPage.tsx:283-289` |
| 4 | `feedbackSubmitted` from server data | `VisitDetailPage.tsx:117, 122-123` |
| 5 | Star→interest level comment + TODO | `VisitDetailPage.tsx:60-67` |
| 6 | `propertyImageUrl` TODO in card | `VisitCard.tsx:99-103` |
| 7 | `enabled` guards on cancel/update mutations | `useVisits.ts:130-136, 145-148` |
| 8 | Schedule conflict warning | `useVisits.ts:24-31, 80-105` |
| 9 | Past tab groups past-dated non-terminal visits | `VisitsPage.tsx:48-66` |
| 10 | `navigator.language` for month label | `VisitsPage.tsx:164-168` |
| 11 | `dayKeyFromValue` local-tz helper | `VisitsPage.tsx:23-30, 92-104` |
| 12 | Mobile calendar banner | `VisitsPage.tsx:271-288` |
| 13 | Day-cell `onClick` + focus ring | `VisitsPage.tsx:200-233` |
| 14 | A-25 comment only (divergent, blocked) | `VisitDetailPage.tsx:75-83` |
| 15 | Dimension drill-down `<Modal>` | `CompatibilityPage.tsx:121-219` |
| 16 | "Top opportunity" card with delta | `CompatibilityPage.tsx:230-256, 308-325` |
| 17 | "What we couldn't compare" section | `CompatibilityPage.tsx:257-261, 352-378` |
| 18 | Redundant Summary → strength-vs-gap language | `CompatibilityPage.tsx:165-176, 326-345` |
| 19 | Removed `COLOR_STATUS` dead code | `CompatibilityPage.tsx:18-22` |
| 20 | `Number.isInteger` guard on peerId | `CompatibilityPage.tsx:268-272` |
| 21 | `isPending` prop on SocietyTagVoteRow | `SocietyTagVoteRow.tsx:11, 22, 36, 53-69, 80-86` |
| 22 | `onMutate`/`onError`/`onSuccess` cache updates | `useSocietyTags.ts:35-98` |
| 23 | Disputed tooltip | `SocietyTagVoteRow.tsx:45` |

---

## F8 — Profile + Settings + Safety (CANCELLED)

**Status:** Agent was cancelled. No fixes applied.

**Pending items from audit:**
- Photo delete affordance
- Account-delete error honesty
- `useBlockUser` hook extraction
- Unblock optimistic update
- Settings-notification success/error toasts
- Phone-number length validation
- Profile-view time-based cap
- Help page anchors + support route
- Appearance page copy + swatches + preview
- Alert real filters + frequency UI
- Saved-search chip values + edit/clone
- Location page typeahead
- Profile "Install" duplicate rows

---

## F9 — Admin + Moderation (CANCELLED)

**Status:** Agent was cancelled. No fixes applied.

**Pending items from audit:**
- Empty state on stats page
- Hydration warning on listing `created_at`
- Nested `<a><button>` fix
- Approve confirmation modal
- Suspend typed-confirmation + required notes
- Prescreen nav item
- Pagination on queues
- Status filter chips
- `Number.isInteger` guard on prescreen `:id`
- `staleTime` on admin stats

---

## F10 — State, API, Data Layer (15 fixes)

| # | Fix | File:Line |
|---|-----|-----------|
| 1 | `forbidden` error variant (403 vs 401) | `lib/api/errors.ts:60-62` |
| 2 | `bad_request` error variant (400 vs 422) | `lib/api/errors.ts:72` |
| 3 | `timeout` error variant (408) | `lib/api/errors.ts:54-85` |
| 4 | Race-window documentation | `lib/api/index.ts:22-32` |
| 5 | `getAuthState` body-type TODO | `lib/api/auth.ts:108-119` |
| 6 | `validateApiResponse` pilot (Zod response validation) | `useBootstrap.ts` + `lib/schemas/profile.ts:109-121` |
| 7 | `useAuthStateQuery` (useQuery + midAuthFlow guard) | `providers.tsx` |
| 8 | Expanded retry to honor rate_limit/forbidden/validation | `providers.tsx` |
| 9 | `setQueryDefaults(['catalogs'], 30min)` | `providers.tsx` |
| 10 | Persistent-toast eviction guard | `ui-store.ts:114-132` |
| 11 | Array-aware equality in `searchStore.setFilter` | `search-store.ts` |
| 12 | `mapStore.setBounds` short-circuit | `map-store.ts:41-55, 83-97` |
| 13 | `onboardingStore` version field on persist | `onboarding-store.ts:128-140, 142-152` |
| 14 | Real LRU eviction in `storage.ts` | `storage.ts` |
| 15 | `swipeStore.cardQueue` server-state documentation | `swipe-store.ts:1-12` |

---

## F11 — Design System + Components (16 fixes)

| # | Fix | File:Line |
|---|-----|-----------|
| 1 | Google button → `--color-google-*` tokens | `globals.css:51-55,176-180`, `Button.tsx:55-57` |
| 2 | SearchBar recent-searches a11y | `SearchBar.tsx:108-145, 65-93` |
| 3 | PropertyDetailPanel/Sheet close `focusRing` | `PropertyDetailPanel.tsx:9,34`, `PropertyDetailSheet.tsx:6,37` |
| 4 | Avatar hand-rolled focus → `focusRing` | `Avatar.tsx:3,127` |
| 5 | Avatar `aria-label` (no-image case) | `Avatar.tsx:101-102` |
| 6 | SegmentedControl Enter/Space activation | `SegmentedControl.tsx:48-58, 92` |
| 7 | Toast safe-area bottom padding | `Toast.tsx:80` |
| 8 | Button `active:scale` dedupe | `Button.tsx:67-68, 78, 92` |
| 9 | SearchBar `focus-within:scale` removed | `SearchBar.tsx:99` |
| 10 | Card `flat` and `stacked` variants | `Card.tsx:4, 17, 22-23, 35, 41` |
| 11 | Toggle `bg-white` → `bg-surface-elevated` | `Toggle.tsx:44` |
| 12 | Badge `text-white` → `text-paper` | `Badge.tsx:51` |
| 13 | Reduced-motion `layoutId` fix | `ThemeToggle.tsx:26,64`, `SegmentedControl.tsx:29,106` |
| 14 | New `destructive` Button variant | `Button.tsx:11, 58-59` |
| 15 | New `inverted` Button variant | `Button.tsx:12, 60-61` |
| 16 | DESIGN.md updated with new variants | `DESIGN.md:157-168, 174, 387, 388` |

---

## F12 — Cross-Cutting (a11y/perf/PWA/build) (12 fixes)

| # | Fix | File:Line |
|---|-----|-----------|
| 1 | `viewport-fit=cover` | `index.html:6` |
| 2 | Bundle: removed supabase/leaflet from manualChunks, added framer-motion | `vite.config.ts:138-142` |
| 3 | SW `navigateFallback` + runtimeCaching | `vite.config.ts:79-115` |
| 4 | iPadOS detection TODO | `usePWA.ts:36-42` |
| 5 | PWA `registerType: "prompt"` + update toast | `vite.config.ts:9`, `usePWA.ts:79-141` |
| 6 | `RouteBoundary` per-route error boundaries | `ErrorBoundary.tsx:52-54`, `App.tsx:5, 90-181` |
| 7 | Plausible dead-code comment | `Plausible.tsx:1-6` |
| 8 | `entry.tsx` HTML escape + maintenance redirect | `entry.tsx:8-49` |
| 9 | `useCountUp` reduced-motion snap | `useCountUp.ts:16-28` |
| 10 | Font preload: Inter only (3 others deferred) | `index.html:34-36` |
| 11 | Connection-aware prefetch + AbortController | `lib/prefetch.ts:30-82` |
| 12 | PWA manifest categories + screenshots | `vite.config.ts:22-23, 30, 68-82` |

---

## Known Regressions / Follow-ups

| Item | Agent | File | Description |
|------|-------|------|-------------|
| Test failure | F6 | `hooks/__tests__/useConversations.test.tsx` | 4 tests expect old `useMessages(conversationId, page)` API; needs update for `useInfiniteQuery` |
| Wire divergences | A-1..A-25 | `.todo/wire-protocol-divergences.md` | 25 items paused pending per-divergence review |
| Surface area | B-1..B-6 | `docs/adr/follow-ups/2026-06-18-surface-area-blocked.md` | 6 items blocked on backend |
| Dead code | C-1..C-10 | `docs/adr/2026-06-18-wire-protocol-divergences.md §5.3` | 10 items added to doc, not deleted |
| Cancelled agents | F3, F4, F8, F9 | — | ~60 audit items not addressed; listed under each agent's section above |

---

## Files Modified (by agent)

### F1 (24 files)
`index.html`, `public/llms.txt`, `scripts/prerender.ts`, `scripts/generate-sitemap.ts`, `src/pages/public/{SearchPage,SemanticSearchPage,CityPage,AboutPage,TermsPage,PrivacyPage,StatsPage,ErrorPage,MaintenancePage}.tsx`, `src/lib/seo/{SeoHelmet,schema}.ts`, `src/components/landing/{landing-data,TestimonialsSection,HeroSection,BottomCTA,FAQAccordion,FeatureBento,HowItWorks,CitiesShowcase,CompatibilitySection,TrustStrip}.tsx`

### F2 (10 files)
`src/pages/auth/{LoginPage,ForgotPasswordPage,AuthCallbackPage,_password-policy}.tsx`, `src/pages/app/{ChooseRolePage,VerifyPage}.tsx`, `src/components/onboarding/OnboardingStepContent.tsx`, `src/hooks/{useResendTimer,useWebOtp}.ts`

### F5 (8 files)
`src/pages/app/{PostPage,MyListingEditPage,ManagePage,MyListingDetailPage,DashboardPage,AnalyticsPage}.tsx`, `src/hooks/queries/useProperties.ts`, `src/hooks/useDirtyFormGuard.ts`

### F6 (10 files)
`src/pages/app/{ChatsPage,ChatDetailPage,NotificationsPage}.tsx`, `src/components/molecules/{ChatMessageBubble,NotificationCard}.tsx`, `src/hooks/queries/{useConversations,useNotifications}.ts`, `src/hooks/useSSE.ts`, `src/lib/sse/{broadcast,index}.ts`

### F7 (8 files)
`src/pages/app/{VisitsPage,VisitDetailPage,CompatibilityPage}.tsx`, `src/components/molecules/{VisitCard,SocietyTagVoteRow}.tsx`, `src/hooks/queries/{useVisits,useSocietyTags}.ts`, `src/components/molecules/index.ts`

### F10 (12 files)
`src/providers.tsx`, `src/lib/api/{errors,client,index,auth}.ts`, `src/lib/schemas/profile.ts`, `src/hooks/queries/useBootstrap.ts`, `src/lib/stores/{ui-store,search-store,map-store,onboarding-store,storage,swipe-store}.ts`

### F11 (9 files)
`src/styles/globals.css`, `DESIGN.md`, `src/components/ui/{Button,SearchBar,Avatar,SegmentedControl,Toast,Card,Toggle,Badge,ThemeToggle}.tsx`, `src/components/organisms/{PropertyDetailPanel,PropertyDetailSheet}.tsx`

### F12 (7 files)
`index.html`, `vite.config.ts`, `src/App.tsx`, `src/entry.tsx`, `src/components/ErrorBoundary.tsx`, `src/components/analytics/Plausible.tsx`, `src/hooks/{usePWA,useCountUp,prefetch}.ts`
