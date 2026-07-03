# 360 Flatmates Web Application -- PRD and Technical Specification

## Context

The 360 Flatmates mobile app (Flutter) has 27+ screens, 38+ API endpoints, Supabase Auth, real-time messaging, swipe deck, chat, visits, listings, and an 8-step onboarding flow. The web application is a **greenfield project** -- the repo at `360-flatmates-web` contains only an OpenAPI spec file and empty placeholder files. This PRD defines the complete product and technical specification for building a Vite + React Router v7 SPA that replicates all mobile features and adds web-specific features (advanced search, saved searches, analytics dashboard, etc.) using the existing backend API.

> **Architecture note:** The project was originally specified as Next.js but implemented as a Vite 8 + React Router v7 client-side SPA. All pages are CSR. SEO for public pages should be addressed via pre-rendering (e.g., prerender spa plugin) or a separate SSR layer if needed in future.

---

## 1. Product Overview

360 Flatmates Web is a greenfield Vite + React Router v7 SPA that mirrors and extends the existing Flutter mobile client. The web app serves two strategic purposes: (a) providing a full-featured authenticated experience for existing mobile users who prefer desktop browsing, and (b) creating a publicly indexable discovery surface for SEO-driven acquisition of new users.

The product combines three user intents under one roof -- finding a co-hunter, advertising a spare room, and being open to either -- powered by a 6-dimension compatibility engine, a swipe-based discovery metaphor adapted for desktop, structured listing templates, rich chat with visit scheduling, and a society insights layer. The web version introduces features that leverage the desktop form factor: advanced multi-filter search panels, saved searches with email/push alerts, a Room Poster analytics dashboard, keyboard-driven swipe navigation, and server-clustered map views.

**Target Market:** Pan-India, young professionals aged 22-32, across Bangalore, Delhi NCR, Mumbai, Hyderabad, Pune, and tier-2 expansion cities.

**Monetization:** None in V1. Freemium UI patterns (boost slots, swipe caps, super-like scarcity) are built in to prepare for V2 paywall introduction.

**Backend:** The web app consumes the same FastAPI monolith backend (`/api/v1`) already serving the Flutter client. No new backend services are required.

---

## 2. User Personas

### Persona A -- Priya, 26, Bangalore

Software engineer relocating from Chennai. Needs a room in Koramangala or HSR within 2 weeks. Introverted, non-smoker, vegetarian, WFH 3 days. Biggest fear: incompatible flatmate lifestyle. Mode: Co-Hunter / Open to Both. Primary need: compatibility first, location second. On web, Priya uses the advanced search with 25+ filters to shortlist, saves her search, and sets up a daily alert for new Koramangala listings under Rs 25k.

### Persona B -- Arjun, 29, Delhi NCR

Startup employee in a 3BHK in Gurugram, one flatmate moving out. Needs a clean, professional replacement. Has a dog. Mode: Room Poster. Primary need: find a trustworthy person fast. On web, Arjun uses the Room Poster Dashboard to track listing views, likes, and conversations. He shares his listing via the WhatsApp share card and monitors society tag votes.

### Persona C -- Meera and Siddharth, 24 and 25, Mumbai

College friends both starting new jobs. Need a third person. Mode: Co-Hunter (group). Primary need: find a compatible third person. On web, they browse the map view with clustered pins to identify viable localities, then use semantic search ("quiet flatshare near Bandra station under 30k with pet-friendly society") to discover options.

---

## 3. Information Architecture

### 3.1 Public Surface (SEO-indexable, no auth required)

Note: `/explore` renders the map for both public and authenticated users. Unauthenticated users see a limited view (no compatibility scores, auth wall on contact).

| Route | Page | Notes |
|-------|------|-------|
| `/` | Landing page | CSR (SEO via pre-render if needed) |
| `/discover` | Browse listings (public feed) | CSR |
| `/discover/[id]` | Listing detail page | CSR (SEO via pre-render if needed) |
| `/search` | Advanced search with 25+ filters | CSR |
| `/search/semantic` | Semantic/vector search | CSR |
| `/stats` | City statistics (cold-start counter) | CSR |
| `/share/[id]` | Share card (OG image target) | CSR |

### 3.2 Authenticated Surface (auth required)

| Route | Page | Notes |
|-------|------|-------|
| `/login` | Phone OTP + Password auth | CSR |
| `/onboarding/*` | Multi-step onboarding flow | CSR |
| `/home` | Personalized home feed | CSR |
| `/swipe` | Swipe deck (desktop-adapted) | CSR |
| `/likes` | Incoming likes | CSR |
| `/chats` | Conversation list | CSR |
| `/chats/[id]` | Chat thread | CSR |
| `/explore` | Map view (public + authenticated) | CSR |
| `/post` | Listing builder (8-step) | CSR |
| `/manage` | Manage listings (Room Poster) | CSR |
| `/dashboard` | Room Poster analytics dashboard | CSR |
| `/visits` | Upcoming/past visits | CSR |
| `/visits/[id]` | Visit detail | CSR |
| `/profile` | Profile view/edit | CSR |
| `/profile/[id]` | Public profile view | CSR |
| `/settings` | App settings | CSR |
| `/notifications` | Notification center | CSR |
| `/saved-searches` | Saved searches CRUD | CSR |
| `/alerts` | Search alerts management | CSR |

### 3.3 Mode-Dependent Navigation

The sidebar navigation adapts per user mode, mirroring the mobile bottom nav:

| Nav Item | Room Poster | Co-Hunter | Open to Both |
|----------|-------------|-----------|--------------|
| Home | Yes | Yes | Yes |
| Post / Manage | Yes | -- | -- |
| Explore (Map) | -- | Yes | Yes |
| Swipe | Yes | Yes | Yes |
| Likes | Yes | Yes | Yes |
| Chats | Yes | Yes | Yes |
| Dashboard | Yes | -- | -- |
| Profile | Yes | Yes | Yes |

On mobile viewports (< 768px), the sidebar collapses to a bottom navigation bar matching the 5-tab mobile app pattern.

---

## 4. User Flows

### 4.1 New User Acquisition (Public -> Auth)

1. User lands on `/discover` or `/search` from Google
2. Browses public listings (blurred contact details, limited profile info)
3. Clicks "Contact" or "Like" -> Auth Wall Modal (inline OTP login form, preserves page context)
4. Phone OTP or password login via Supabase Auth
5. If new user: redirect to `/onboarding`
6. Bootstrap: `GET /flatmates/bootstrap` loads profile + catalogs + counts
7. If `onboarding_completed === false`: redirect to onboarding flow
8. After onboarding: redirect to `/home`

### 4.2 Onboarding Flow

Steps 0-7: Splash -> Mode Selection -> Location -> Basic Info -> Profile Photo -> Lifestyle Quiz (6 dimension cards) -> Budget & Timeline -> Preferences & Non-Negotiables -> (Room Poster: redirect to `/post` for listing builder, not an onboarding step) -> Home Feed

Phone Auth occurs at `/login` before onboarding begins. Each step has a single primary CTA, progress indicator, and back navigation. Total time target: under 4 minutes. Onboarding progress is tracked server-side: `onboarding_current_step` field in profile allows resuming from the last completed step on re-entry.

**Detailed step breakdown:**

0. **Splash** (3 slides): Welcome illustration, "Find your vibe" tagline, privacy trust badge
1. **Mode Selection**: Room Poster / Co-Hunter / Open to Both with icons and descriptions
2. **Location Selection**: Popular cities from catalog + GPS detection + search
3. **Basic Info**: Full name, age (18-100), profession
4. **Profile Photo**: Image picker + upload via backend API (Cloudinary). Client-side compress to max 2MB, auto-crop to 1:1. Preview before upload.
5. **Lifestyle Quiz**: 6 dimension cards -- Sleep Schedule, Cleanliness, Food Habits, Smoking/Drinking, Guests Policy, Work Style -- each with 3-4 option chips
6. **Budget & Timeline**: Budget min/max (range slider ₹5,000-100,000), Move-in timeline (immediate/this_month/next_month/flexible)
7. **Preferences & Non-Negotiables**: Gender preference, 10 non-negotiable chips (food_veg_only, no_smoking, no_drinking, no_overnight_guests, no_pets, gender_female_only, gender_male_only, no_parties, min_tidy, early_riser)

Draft persisted to localStorage (survives tab close). Key: `360-flatmates-onboarding-draft`. On re-entry, prompt user to resume. Clear draft on successful profile submit. On submit: `PUT /flatmates/profile` with all accumulated data, then reload bootstrap.

### 4.3 Swipe Flow (Desktop-Adapted)

1. User navigates to `/swipe`
2. `GET /flatmates/profiles` fetches swipe deck (with city/budget filters)
3. Swipe deck renders collapsed cards in a central panel (max-width 480px)
4. **Keyboard shortcuts**: Left arrow = Pass, Right arrow = Like, Up arrow = Super Like, Space = expand card
5. **Mouse**: Click action bar buttons (Pass / Super Like / Like), or click-and-drag card with snap-back animation
6. Click card body -> expanded view in right-panel drawer (desktop) or full-screen overlay (tablet/mobile)
7. Expanded view shows: Society info, Room details, Flat config, Costs, About Me, Society Insights, Compatibility Breakdown
8. Swipe action fires `POST /flatmates/swipes` (target_type=user)
9. `POST /flatmates/profile-views` records view analytics (duration, scroll depth)
10. On mutual match: match celebration modal (confetti animation) + Q&A nudge -> opens chat thread
11. Super-like: 3/day cap, 429 on limit exceeded
12. Empty deck: illustrated empty state with "Check back later" message

### 4.4 Search and Save Flow (Web-Specific)

1. User navigates to `/search`
2. Multi-panel filter sidebar: location, budget, room type, furnishing, gender, move-in, amenities, society type, society vibe tags, sharing type
3. Results update with URL-driven state (sharable search URLs via nuqs)
4. `GET /flatmates/web/search` with 25+ filter parameters, search_type (listings/profiles/all), sort_by (includes match_percentage)
5. "Save this search" -> modal for name + alert settings (frequency: instant/daily/weekly, channels: email/push/in_app) -> `POST /flatmates/web/saved-searches`
6. Saved searches accessible from `/saved-searches` with re-run and alert toggle
7. Search alerts at `/alerts` with CRUD management

### 4.5 Chat and Visit Scheduling

1. User enters `/chats` (split layout on desktop: conversation list left, thread right)
2. Two tabs on conversation list: Likes (grid of incoming likes with Match button) + Chats (list of conversation cards)
3. Select conversation -> `/chats/[id]`
4. Q&A answers displayed if both parties completed (collapsible)
5. Match context card pinned at top (property photo, mode, locality, rent)
6. Icebreaker suggestions and Q&A nudge in pre-message area
7. Real-time messages via Supabase private Broadcast from the bootstrap realtime config
8. Message types: text, image (upload via backend API/Cloudinary), visit_request
9. Schedule Visit: Calendar date picker (up to 90 days) + time slot chips (Morning/Afternoon/Evening) + optional note -> `POST /visits` + sends chat message with `message_type=visit_request`
10. Visit request card renders in chat thread with Confirm/Reschedule/Cancel actions
11. Auto mark-as-read on conversation enter: `POST /flatmates/conversations/{id}/mark-read`
12. Block/Report available from chat header menu
13. Q&A submission: `POST /flatmates/conversations/{id}/qna`

### 4.6 Listing Management Flow (Room Poster)

1. Create listing: `/post` -> 8-step wizard
   - Step 0: Location (society name, address, city, locality)
   - Step 1: Society (type: gated/standalone, amenities, vibe tags)
   - Step 2-3: Room (type: private/shared, furnishing, features, photo upload 2-10 via backend API/Cloudinary, video tour URL)
   - Step 4: Flat (config 1-4BHK, floor, total floors, amenities)
   - Step 5: Costs (monthly rent, security deposit, maintenance, electricity, cook/maid/setup costs, total monthly outflow calc)
   - Step 6: About (typical day description, gender preference, age range 18-40, non-negotiables, available from date)
   - Step 7: Review (summary of all data, jump back to any step)
2. `POST /properties` -> listing enters 24hr review (AI pre-screen runs first)
3. Navigate to listing review page: status (pending_review/rejected), 3-step progress indicator, "What happens next" steps
4. Realtime `listing_status_changed` event auto-refreshes status
5. Manage listings at `/manage`: segmented tabs (Active/Pending/Drafts/Paused/Expired) with Pause/Resume, Share, Edit, View Stats, Renew actions. Rejected listings visible inside Expired tab with a "Rejected" badge.
6. Room Poster Dashboard at `/dashboard`: total listings, views/likes/conversations/visits per listing (30d), boost status

### 4.7 Visit Management Flow

1. Schedule from chat or listing detail -> `POST /visits`
2. Visits page at `/visits`: Timeline view with sections (Confirmed, Requested, Completed)
3. Visit actions: Confirm (`PUT /visits/{id}`), Reschedule (`POST /visits/{id}/reschedule`), Cancel (`POST /visits/{id}/cancel`), Complete (`POST /visits/{id}/complete`)
4. Visit types: `flatmate_meet` (requires conversation_id + counterparty_user_id), `property_tour`
5. Realtime `visit_updated` event refreshes visit data

### 4.8 Profile & Settings Flow

1. Profile at `/profile`: Avatar, name, mode badge, location, verified trust badge
2. Edit profile at `/profile`: Photo, basic info, mode, budget/timeline, lifestyle (6 dimensions), non-negotiables (10 options), bio
3. `PUT /flatmates/profile` on save -> reload bootstrap
4. Settings at `/settings`:
   - Account: Edit Profile, Change Password, Privacy
   - App: Notifications, Blocked Users (`GET /flatmates/blocks`, `DELETE /flatmates/blocks/{id}`)
   - Legal: About, Terms, Privacy
   - Preferences: Theme (light/dark/system), Palette (3 options: Terracotta/Ember/Monsoon Teal), Language (en/hi), Hide last name, Hide exact location
5. Change Password: new password + confirmation -> Supabase `updateUser`

### 4.9 Notification Flow

1. Notifications at `/notifications`: `GET /flatmates/notifications`
2. Types: new_match, new_message, listing_approved, listing_rejected, visit_scheduled, visit_confirmed, general
3. Tap notification: mark as read (`PUT /flatmates/notifications/{id}`) + navigate via route field
4. Mark all read: `PUT /flatmates/notifications`
5. FCM web push: `POST /notifications/devices/register` with `platform: 'web'`
6. Realtime `new_notification` event increments badge + shows toast

### 4.10 Admin Moderation Flow

1. `/admin/moderation/listings`: Pending listing queue, auto-pauses expired listings
2. `/admin/moderation/reports`: Open reports queue
3. Actions: Approve/Reject/Request Edit for listings; Dismiss/Warn/Suspend/Escalate for reports
4. AI pre-screen: `POST /flatmates/moderation/prescreen/{id}` checks photos, required fields, pricing anomalies, spam
5. First approval auto-applies 24hr launch boost

---

## 5. Feature Specifications

### 5.1 Mobile Features to Replicate (12 core)

| Feature | Web Adaptation Notes |
|---------|---------------------|
| Phone OTP + Password Auth | Supabase Auth JS SDK, same flow, web push via FCM web token |
| Multi-step Onboarding | 8 steps (0-7) with progress indicator, same content as mobile |
| Hybrid Swipe Deck (collapsed + expanded) | Keyboard shortcuts + mouse drag + click action bar; expanded view in right-panel drawer |
| Compatibility Engine (6-dimension scoring) | Client-side calculation identical to mobile, same weights and thresholds |
| Listing Builder (8-step) | Multi-step form with React Hook Form + Zod, same validation rules |
| Chat with Real-time Updates | Supabase private Broadcast for message updates; no interval refetch fallback |
| Visit Scheduling/Confirmation | Calendar date picker + time slot pills, same as mobile |
| Match Flow + Q&A Nudge | Match celebration modal, Q&A bottom sheet |
| Notifications | In-app notification center + FCM web push |
| Profile Editing | Same fields, photo upload via backend API (Cloudinary) |
| Mode-Dependent Navigation | Sidebar on desktop, bottom nav on mobile viewport |
| Trust & Safety (Report/Block) | In-chat report, block, unmatch -- same API contracts |

### 5.2 Web-Specific Features (9 additions)

| Feature | Description | API Endpoints |
|---------|-------------|---------------|
| Advanced Search with 25+ Filters | Multi-panel filter sidebar on `/search`, URL-driven state for sharing | `GET /flatmates/web/search` |
| Saved Searches CRUD | Create, view, re-run, update, delete saved searches | `GET/POST /flatmates/web/saved-searches`, `PUT/DELETE /flatmates/web/saved-searches/{id}`, `POST /flatmates/web/saved-searches/{id}/run` |
| Search Alerts | Email/push/in-app alerts on new matching listings | `GET/POST /flatmates/web/alerts`, `PUT/DELETE /flatmates/web/alerts/{id}` |
| Room Poster Dashboard | Analytics dashboard with listing performance, views, likes, conversations, visits | `GET /flatmates/web/dashboard` |
| Listing Analytics | Per-listing view counts, engagement metrics, daily trends, boost status | `GET /flatmates/web/listings/{id}/analytics` |
| Share Card Generation (Server-Side) | WhatsApp/Instagram formatted share images | `GET /flatmates/web/listings/{id}/share-card` |
| Compatibility Breakdown Page | Dedicated page showing per-dimension scores with animated rings | `GET /flatmates/web/compatibility/{user_id}` |
| Keyboard-Driven Swipe Navigation | Left/Right/Up arrow keys, Space for expand, Escape to dismiss | -- |
| City Statistics Page | Public stats page for cold-start transparency | `GET /flatmates/web/stats` |

---

## 6. Page Inventory

### 6.1 Public Pages (6)

1. `/` -- Landing page (CSR, SEO via pre-render if needed)
2. `/discover` -- Public listing browse (CSR)
3. `/discover/[id]` -- Listing detail (CSR)
4. `/search` -- Advanced search (CSR)
5. `/search/semantic` -- Semantic search (CSR)
6. `/stats` -- City statistics (CSR)
7. `/share/[id]` -- Share card redirect (CSR)

### 6.2 Auth Pages (2)

8. `/login` -- Phone OTP + Password (CSR)
9. `/onboarding/*` -- Multi-step onboarding (CSR)

### 6.3 Authenticated Pages (19)

10. `/home` -- Personalized feed (CSR)
11. `/swipe` -- Swipe deck (CSR)
12. `/likes` -- Incoming likes grid (CSR)
13. `/chats` -- Conversation list (CSR)
14. `/chats/[id]` -- Chat thread (CSR)
15. `/explore` -- Map view (CSR)
16. `/post` -- New listing builder (CSR)
17. `/post/review` -- Listing review status (CSR)
18. `/manage` -- Listing management (CSR)
19. `/dashboard` -- Room Poster analytics (CSR)
20. `/visits` -- Visits list (CSR)
21. `/visits/[id]` -- Visit detail (CSR)
22. `/profile` -- Profile view/edit (CSR)
23. `/profile/[id]` -- Public profile view (CSR)
24. `/settings` -- Settings (CSR)
25. `/settings/blocked-users` -- Blocked users list (CSR)
26. `/settings/notifications` -- Notification preferences (CSR)
27. `/notifications` -- Notification center (CSR)
28. `/saved-searches` -- Saved searches (CSR)
29. `/alerts` -- Search alerts (CSR)

### 6.4 Legal & Utility Pages (8)

30. `/terms` -- Terms & Conditions (CSR)
31. `/privacy` -- Privacy Policy (CSR)
32. `/about` -- About 360 Flatmates (CSR)
33. `/not-found` -- 404 page (static)
34. `/error` -- 500 error page (static)
35. `/maintenance` -- Maintenance page (static)
36. `/forgot-password` -- Password reset flow (CSR)

### 6.5 Admin Pages (3, separate route group)

37. `/admin/moderation/listings` -- Listing review queue (CSR)
38. `/admin/moderation/reports` -- Report review queue (CSR)
39. `/admin/moderation/prescreen/[id]` -- AI pre-screen trigger (CSR)

---

## 7. Component Architecture

### 7.1 Design System Components (Atoms)

Following the "ink on paper" design system from the mobile DESIGN.md, adapted for web:

| Component | Web Implementation | Design Notes |
|-----------|-------------------|--------------|
| `Button` (Primary/Secondary/Tertiary) | CVA variants with press-scale 0.97 | Terracotta fill, 10px radius, 52px height |
| `Card` | Interactive press-glow via CSS `:active` | 16px radius, warm shadow sm |
| `Chip` | Filter/tag with `.choice()` variant | 999px pill radius, selection spring 1.03 scale |
| `SearchBar` | Input with leading/trailing icons | 9px radius, focus glow, 1.01 scale lift |
| `Avatar` | Image + initials fallback | 52px, 12px rounded square (editorial) |
| `Badge` | Mode/verified/status badges | Pill-shaped, pastel bg |
| `Input` | Text/select/textarea | 9px radius, focus glow |
| `ProgressRing` | Animated SVG circle | Compatibility score, 300ms ease-out arc draw |
| `Skeleton` | Shimmer gradient placeholder | CSS animation, 1200ms linear repeat |
| `Toast` | Notification toasts | 16px radius, auto-dismiss |
| `Modal` | Dialog/drawer/modal | 8px radius, frosted-glass backdrop |
| `BottomSheet` | Slide-up panel | Web: Drawer from right on desktop, bottom on mobile |

### 7.2 Molecule Components

| Component | Composition |
|-----------|-------------|
| `ListingCard` | Card + Avatar + Chip + ProgressRing + PriceText |
| `ProfileGridCard` | Avatar + ProgressRing + Button (Match CTA) |
| `ConversationRow` | Avatar + text content + unread badge + timestamp |
| `NotificationCard` | Icon container + title + description + timestamp + unread dot |
| `MenuItemRow` | Icon container + label + chevron |
| `FilterPanel` | SearchBar + Chip groups + range sliders + toggle groups |
| `SwipeActionBar` | Three buttons (Pass/Super Like/Like) with icon + label |
| `ChatMessageBubble` | Sent (terracotta bg, white text) / Received (paper-3 bg, ink text) |
| `VisitCard` | Property thumbnail + date/time + status badge + action buttons |
| `MatchContextCard` | Thumbnail + mode badge + locality + rent range |
| `QnACard` | Question + answers from both parties + "Both answered" banner |
| `SocietyTagVoteRow` | Tag label + up/down vote buttons + dispute badge |

### 7.3 Organism Components

| Component | Composition |
|-----------|-------------|
| `AppShell` | Sidebar + top bar + main content area + bottom nav (responsive) |
| `SwipeDeck` | Card stack + SwipeActionBar + expanded drawer |
| `ChatThread` | Message list + input bar + MatchContextCard + visit cards |
| `ListingBuilder` | Multi-step form with step indicator + navigation |
| `FeedSection` | Section header + horizontal card scroll |
| `MapExplorer` | Map component + filter bar + cluster cards |
| `SearchResults` | Filter sidebar + result grid + pagination + saved-search CTA |
| `DashboardPanel` | Metric cards + trend chart + listing performance table |

### 7.4 Template Components

| Template | Layout |
|----------|--------|
| `PublicPage` | Nav bar + hero + content + footer (SEO-optimized) |
| `AuthenticatedPage` | AppShell wrapper, sidebar + content |
| `FormPage` | Step indicator + form area + CTA bar |
| `ChatPage` | Full-height thread, split layout on desktop |
| `DashboardPage` | Sidebar nav + metric cards + detail panels |

---

## 8. State Management Strategy

### 8.1 Server State -- TanStack Query v5

All API data flows through TanStack Query. Query keys follow a structured pattern:

```
['bootstrap']
['profile']
['catalogs']
['listings', filters]
['listing', id]
['profiles', filters]
['matches']
['conversations']
['conversation', id]
['messages', conversationId, params]
['likes', params]
['visits', params]
['notifications']
['saved-searches']
['search-alerts']
['web-search', filters]
['map-view', params]
['city-stats', city?]
['listing-analytics', id, period]
['dashboard']
['compatibility', userId]
['blocks']
```

**Mutation patterns:**
- Optimistic updates for: swipe actions, message send, visit scheduling, block/report
- Cache invalidation on success: after profile update invalidate `['profile']`, after listing create invalidate `['listings']`, after message send invalidate `['messages', conversationId]` and `['conversations']`
- Infinite queries for: messages (cursor-based), listings (page-based), search results (page-based)

**Stale times:**
- Bootstrap/catalogs: 30 minutes
- Profile: 5 minutes
- Conversations/messages: 0 (always fresh)
- Listings/search: 2 minutes
- City stats: 15 minutes

### 8.2 Client UI State -- Zustand

Small, focused stores for ephemeral UI state only:

| Store | State |
|-------|-------|
| `useAuthStore` | `user`, `session`, `isAuthenticated`, `isLoading` |
| `useOnboardingStore` | `currentStep`, `draftData`, `isSubmitting`, `resumedStep` |
| `useSwipeStore` | `currentIndex`, `deck`, `isExpanded`, `isAnimating` |
| `useChatStore` | `activeConversationId`, `draftMessages`, `isTyping`, `showInfoPanel` |
| `useUIStore` | `sidebarOpen`, `theme`, `palette`, `locale`, `activeModal` |
| `useMapStore` | `center`, `zoom`, `bounds`, `selectedPin`, `filters` |
| `useSearchStore` | `filters`, `sortBy`, `searchType`, `savedSearchName` |

### 8.3 Form State -- React Hook Form + Zod

All multi-step forms use React Hook Form with Zod schemas for validation:

- Onboarding form (7+ steps)
- Listing builder (8 steps)
- Profile edit form
- Visit scheduling form
- Saved search create/edit form
- Report/block forms
- Q&A answer form

Zod schemas are shared between client validation and API type generation (via openapi-typescript).

### 8.4 URL State -- nuqs

Search and filter parameters are synced to URL query parameters using nuqs:

- `/search?q=&city=&price_min=&price_max=&sharing_type=&move_in=&amenities=&sort_by=&page=`
- `/discover?city=&locality=&vibe=&move_in=`
- `/chats/[id]?before=`

This enables deep linking, browser back/forward, and shareable search URLs.

---

## 9. Real-time Strategy

### 9.1 Supabase Broadcast for Event Streaming

The web app uses Supabase Realtime private Broadcast channels supplied by the `/flatmates/bootstrap` realtime config. The client authorizes Realtime with the Supabase access token, subscribes to the configured private channel, and invalidates TanStack Query caches from broadcast events. No legacy backend stream endpoint is used.

**Realtime Broadcast Event Types:**
- `new_match` -- refresh matches list, show toast
- `new_message` -- append to active chat if conversation is open, otherwise increment unread badge
- `conversation_updated` -- refresh conversation list
- `visit_updated` -- refresh visit detail if viewing, update visit card in chat
- `listing_status_changed` -- refresh managed listings
- `new_notification` -- increment notification badge, show toast

### 9.2 Connection Management

- Supabase Realtime channel subscription established after successful auth and active bootstrap config
- Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Connection status tracked in `uiStore.realtimeState`
- Visual indicator when real-time is disconnected
- On reconnect: invalidate relevant TanStack Query caches to catch up
- Supabase Realtime manages socket multiplexing; no custom primary-tab election is required.

### 9.3 No Chat Polling Fallback

Realtime failures surface through the generic realtime status indicator while the hook reconnects with backoff. Do not add interval-based chat or conversation-list refetching as a fallback.

### 9.4 Optimistic Message Send

On message send:
1. Optimistically add message to TanStack Query cache with temp ID
2. `POST /flatmates/conversations/{id}/messages`
3. On success: replace temp message with server response
4. On failure: mark message as failed, show retry button

---

## 10. SEO Strategy

### 10.1 Public Content Indexing

Seven pages are fully indexable by search engines:

| Page | Meta Title Pattern | OG Image |
|------|-------------------|----------|
| Landing | "360 Flatmates -- Find Your Flatmate, Find Your Vibe" | Hero illustration |
| Discover | "Browse Flatmate Listings in [City] -- 360 Flatmates" | City-specific |
| Listing Detail | "[Title] in [Locality], [City] -- ₹[Rent]/mo -- 360 Flatmates" | Listing main image |
| Search | "Search Flatmates & Rooms in [City] -- 360 Flatmates" | Search-specific |
| Semantic Search | "Find Flatmates by Lifestyle Match -- 360 Flatmates" | Generic |
| City Stats | "[City] Flatmate Market: [X] Active Seekers -- 360 Flatmates" | City-specific |
| Share Card | "Room Available in [Locality] -- ₹[Rent]/mo -- 360 Flatmates" | Server-generated share card |

### 10.2 Technical SEO

- **Meta tags**: Dynamic `<title>`, `<meta name="description">`, OG tags, and Twitter cards on all public pages via React Helmet or document.title
- **JSON-LD Structured Data**: `RealEstateListing` schema on listing detail pages, `BreadcrumbList` on all pages, `FAQPage` on landing
- **Sitemap.xml**: Dynamic sitemap generated from `GET /properties?property_type=flatmate&limit=1000` + city pages, regenerated every 24 hours via a build script or server endpoint
- **Robots.txt**: Allow all public routes, disallow `/api/`, `/chats/`, `/swipe/`, `/onboarding/`, `/admin/`
- **Canonical URLs**: Set on all pages, trailing slash normalization
- **Core Web Vitals targets**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Image optimization**: `<img>` with `srcset` for AVIF/WebP, responsive sizes, blur placeholders
- **Font loading**: Google Fonts CDN for Fraunces (variable), Inter, JetBrains Mono, Instrument Serif with `display=swap` and subset preload

### 10.3 Cache Invalidation

| Route | Strategy |
|-------|----------|
| `/discover` | TanStack Query staleTime 5min + realtime invalidation on listing update |
| `/discover/[id]` | TanStack Query staleTime 10min + realtime on-demand invalidation on listing update |
| `/stats` | TanStack Query staleTime 15min |
| `/` (landing) | TanStack Query staleTime 24hr |

On-demand revalidation: when a listing is approved, updated, or paused, the realtime `listing_status_changed` event invalidates related property and dashboard query keys.

---

## 11. Performance Strategy

### 11.1 Rendering Strategy Per Page

| Route | Strategy | Rationale |
|-------|----------|-----------|
| `/` | CSR | Stable content, infrequent updates |
| `/discover` | CSR | Fresh content, SEO-critical (consider pre-render) |
| `/discover/[id]` | CSR | Dynamic listing data |
| `/search` | CSR | URL-driven, client-side |
| `/stats` | CSR | Slowly changing data |
| `/login` | CSR | No SEO need, interactive |
| `/onboarding/*` | CSR | Interactive multi-step form |
| `/home` | CSR | Personalized per-user |
| `/swipe` | CSR | Highly interactive, no SEO |
| `/likes` | CSR | Personalized, refreshable |
| `/chats` | CSR | Personalized, refreshable |
| `/chats/[id]` | CSR | Highly interactive, real-time |
| `/explore` | CSR | Map is client-side interactive |
| `/post` | CSR | Complex form, no SEO |
| `/manage` | CSR | Personalized, refreshable |
| `/dashboard` | CSR | Personalized analytics |
| `/visits` | CSR | Personalized, refreshable |
| `/profile` | CSR | Personalized, refreshable |
| `/settings` | CSR | Interactive, no SEO |
| `/notifications` | CSR | Personalized, refreshable |
| `/saved-searches` | CSR | Personalized, refreshable |
| `/alerts` | CSR | Personalized, refreshable |
| `/post/review` | CSR | Interactive status polling |
| `/profile/[id]` | CSR | Public profile view |
| `/settings/blocked-users` | CSR | Interactive, no SEO |
| `/settings/notifications` | CSR | Interactive, no SEO |
| `/terms` | CSR | Stable legal content |
| `/privacy` | CSR | Stable legal content |
| `/about` | CSR | Stable content |
| `/forgot-password` | CSR | Interactive, no SEO |
| `/not-found` | CSR | Error page |
| `/error` | CSR | Error page |
| `/maintenance` | CSR | Error page |

### 11.2 Bundle Optimization

- **Code splitting**: Each route is a separate chunk; heavy components (Map, SwipeDeck, ChatThread) are lazy-loaded via `React.lazy`
- **Tree shaking**: Import only used icons from `lucide-react`; barrel imports banned
- **Dynamic imports**: `React.lazy` + `Suspense` for map components, swipe deck, and chat input
- **Critical CSS**: Tailwind purge ensures only used utilities ship; custom CSS modules for component-specific styles
- **Image optimization**: Responsive `srcset` with `sizes` prop, AVIF/WebP via CDN, blur placeholder data URLs
- **Font subsetting**: Google Fonts loaded via CDN with `display: swap` and subsetting
- **Target budget**: Initial JS < 150KB per route, total page weight < 500KB

### 11.3 Caching Strategy

| Layer | TTL | Key |
|-------|-----|-----|
| TanStack Query (browser) | Per-query staleTime | Structured query key |
| CDN (Vercel/Cloudflare) | 5min-24hr per route | URL + headers |
| Browser HTTP cache | 60s for API, 1yr for static | Cache-Control headers |
| Service Worker (future) | Offline-first for static assets | Precache manifest |

---

## 12. Authentication Architecture

### 12.1 Supabase Auth Integration

The web app uses `@supabase/supabase-js` for authentication:

- **Phone OTP**: `supabase.auth.signInWithOtp({ phone })` -> 6-digit SMS -> `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
- **Password**: `supabase.auth.signInWithPassword({ phone, password })`
- **Session management**: `supabase.auth.getSession()` returns JWT access token + refresh token
- **Token refresh**: Supabase JS SDK handles auto-refresh; `onAuthStateChange` listener updates Zustand auth store

### 12.2 Auth Guard Flow

React Router route guards (AuthGuard component) run on every navigation:

1. Check for Supabase session
2. If no session and route requires auth: show Auth Wall Modal (inline OTP login) or redirect to `/login?redirect={pathname}` for full-page auth
3. If session exists, validate with `supabase.auth.getUser()`
4. If token expired: attempt refresh via `supabase.auth.refreshSession()`
5. If refresh fails: clear session, redirect to `/login`

### 12.3 Auth-Protected API Calls

- **Client-side only**: Access token from Zustand auth store, passed as `Authorization: Bearer {token}` header
- **API client interceptor**: Fetch wrapper that:
  1. Attaches Bearer token from auth store
  2. On 401 response: attempt token refresh
  3. On successful refresh: retry original request
  4. On refresh failure: clear session, redirect to `/login`
  5. Queue concurrent requests during refresh to prevent race conditions

### 12.4 Route Protection Matrix

| Route | Auth Required | Onboarding Required |
|-------|--------------|---------------------|
| `/`, `/discover/*`, `/search/*`, `/stats`, `/share/*` | No | No |
| `/login` | No (redirect if authenticated) | -- |
| `/onboarding/*` | Yes | No (redirect to `/home` if complete) |
| All other authenticated routes | Yes | Yes (redirect to `/onboarding` if incomplete) |

---

## 13. API Integration Layer

### 13.1 API Client Architecture

```
lib/
  api/
    client.ts              -- Fetch wrapper with auth interceptor, base URL, error mapping
    types.ts               -- Auto-generated from OpenAPI spec via openapi-typescript
    queries/               -- TanStack Query hook definitions per domain
      auth.ts
      bootstrap.ts
      profiles.ts
      swipes.ts
      likes.ts
      matches.ts
      conversations.ts
      visits.ts
      listings.ts
      notifications.ts
      blocks-reports.ts
      interactions.ts
      web-discovery.ts
      admin.ts
    mutations/             -- TanStack Query mutation definitions
      swipes.ts
      messages.ts
      visits.ts
      listings.ts
      profile.ts
      blocks-reports.ts
      saved-searches.ts
      alerts.ts
```

### 13.2 Type Generation

Run `openapi-typescript docs/flatmates-openapi.yaml -o lib/api/types.ts` to generate TypeScript types from the OpenAPI spec. All API response/request types derive from this generated file. Manual overrides go in `lib/api/types.override.ts`.

### 13.3 Error Handling in API Layer

API errors map to a typed error hierarchy:

```typescript
type AppError =
  | { type: 'network'; message: string }
  | { type: 'auth'; message: string }
  | { type: 'server'; status: number; message: string }
  | { type: 'not_found'; message: string }
  | { type: 'validation'; fields: Record<string, string[]>; message: string }
  | { type: 'rate_limit'; message: string; retryAfter?: number }
  | { type: 'conflict'; message: string }
  | { type: 'unknown'; message: string }
```

### 13.4 Rate Limiting

| Endpoint Group | Rate Limit | Notes |
|----------------|-----------|-------|
| Search | 30/min | Prevents scraping |
| Swipes | 100/min | Prevents bot swiping |
| Messages | 30/min | Prevents spam |
| Profile views | 60/min | Prevents scraping |
| General API | 120/min | Default for all other endpoints |
| Super-likes | 3/day | Hard cap, 429 on exceed |

Client-side handling: TanStack Query retry with exponential backoff on 429. UI shows Toast "Too many requests. Please wait a moment." on rate limit errors.

### 13.5 Endpoint Map (43 endpoints)

| Tag | Endpoints | Auth |
|-----|-----------|------|
| Auth | `GET /users/me`, `GET /users/location`, `POST /flatmates/auth/reset-password` | Required |
| Bootstrap | `GET /flatmates/bootstrap` | Required |
| Catalogs | `GET /flatmates/catalogs` | Required |
| Profiles | `GET /flatmates/profile`, `PUT /flatmates/profile`, `DELETE /flatmates/profile`, `GET /flatmates/profiles` | Required |
| Swipes | `POST /flatmates/swipes`, `DELETE /flatmates/swipes/last` | Required |
| Likes | `GET /flatmates/likes` | Required |
| Auth | `GET /users/me`, `GET /users/location`, `POST /flatmates/auth/reset-password` | Required |
| Matches | `GET /flatmates/matches`, `PUT /flatmates/matches/{id}/unmatch` | Required |
| Conversations | `GET /flatmates/conversations`, `GET /flatmates/conversations/{id}`, `GET/POST /flatmates/conversations/{id}/messages`, `POST /flatmates/conversations/{id}/mark-read`, `POST /flatmates/conversations/{id}/qna` | Required |
| Visits | `POST /visits`, `GET /visits`, `GET /visits/upcoming`, `GET /visits/past`, `GET/PUT /visits/{id}`, `POST /visits/{id}/reschedule`, `POST /visits/{id}/cancel`, `POST /visits/{id}/complete` | Required |
| Listings | `POST /properties`, `GET /properties`, `GET /properties/semantic-search`, `GET /properties/recommendations`, `GET /properties/me`, `GET/PUT/DELETE /properties/{id}`, `POST /properties/{id}/boost`, `POST /properties/{id}/renew` | Mixed |
| Notifications | `GET/PUT /flatmates/notifications`, `PUT /flatmates/notifications/{id}`, `POST /notifications/devices/register`, `POST /notifications/devices/unregister` | Required |
| Blocks & Reports | `GET/POST /flatmates/blocks`, `DELETE /flatmates/blocks/{id}`, `POST /flatmates/reports` | Required |
| Interactions | `POST /flatmates/profile-views`, `POST /flatmates/listings/{id}/society-tags/votes` | Required |
| Realtime config | `/flatmates/bootstrap` payload `realtime` | Required |
| Admin Moderation | `GET /flatmates/moderation/listings`, `PUT /flatmates/moderation/listings/{id}`, `GET /flatmates/moderation/reports`, `PUT /flatmates/moderation/reports/{id}`, `POST /flatmates/moderation/prescreen/{id}` | Required + Admin |
| Web Discovery | `GET /flatmates/web/search`, `GET/POST /flatmates/web/saved-searches`, `GET/PUT/DELETE /flatmates/web/saved-searches/{id}`, `POST /flatmates/web/saved-searches/{id}/run`, `GET/POST /flatmates/web/alerts`, `PUT/DELETE /flatmates/web/alerts/{id}`, `GET /flatmates/web/map`, `GET /flatmates/web/stats`, `GET /flatmates/web/listings/{id}/share-card`, `GET /flatmates/web/listings/{id}/analytics`, `GET /flatmates/web/dashboard`, `GET /flatmates/web/compatibility/{user_id}` | Mixed |

### 13.6 Public Endpoints (No Auth Required)

These are critical for SEO and the public discovery surface:

- `GET /properties` -- Browse listings (with `property_type=flatmate`)
- `GET /properties/semantic-search` -- Semantic vector search
- `GET /properties/{id}` -- Listing detail (non-live listings visible to owner/admin only)
- `GET /flatmates/web/search` -- Web-optimized search with 25+ filters
- `GET /flatmates/web/map` -- Server-clustered map data
- `GET /flatmates/web/stats` -- City statistics
- `GET /flatmates/web/listings/{id}/share-card` -- Share card image generation

---

## 14. Form Handling

### 14.1 React Hook Form + Zod Pattern

All forms follow this architecture:

```typescript
// 1. Zod schema (co-located with form or in schemas/ directory)
const listingStep1Schema = z.object({
  title: z.string().min(5).max(200),
  locality: z.string().min(1),
  monthly_rent: z.number().min(500),
});

// 2. React Hook Form with Zod resolver
const form = useForm({
  resolver: zodResolver(listingStep1Schema),
  defaultValues: savedDraft ?? {},
});

// 3. Submission handler with TanStack Query mutation
const mutation = useMutation({ ... });
const onSubmit = (data) => mutation.mutate(data);
```

### 14.2 Multi-Step Form State

The listing builder and onboarding flow use a multi-step pattern:

- Step-level Zod schemas validate only the current step
- Draft data persisted to `localStorage` on each step transition (survives tab close)
- `useForm` with `mode: 'onBlur'` for field-level validation
- Final review step aggregates all step data and validates against the full schema
- Navigation: "Next" validates current step, "Back" preserves data, "Save Draft" persists to localStorage
- Draft keys: `360-flatmates-onboarding-draft` (onboarding), `360-flatmates-listing-draft` (listing builder)

### 14.3 Form Fields per Feature

| Form | Steps | Key Fields |
|------|-------|-----------|
| Onboarding | 8 | Name, age, profession, city, photo, 6 lifestyle dimension cards, budget range, move-in timeline, preferences & non-negotiables |
| Listing Builder | 8 | Location, society, room, photos/video, flat, costs, about/preferred flatmate, review |
| Profile Edit | 1 | All FlatmatesProfileUpdate fields |
| Visit Schedule | 1 | Date, time slot, note |
| Saved Search Create | 1 | Name, filter config, alert settings |
| Report | 1 | Reason, optional notes |
| Q&A Answers | 1 | 3 free-text/scale answers |

---

## 15. Accessibility Requirements

### 15.1 WCAG 2.1 AA Compliance

- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (verified against the ink-on-paper palette)
- **Color-only information**: Never convey state by color alone; always pair with icons, text labels, or patterns
- **Touch/click targets**: Minimum 44x44px for all interactive elements
- **Focus indicators**: Visible focus ring on all interactive elements; 2px solid terracotta outline with 2px offset
- **Keyboard navigation**: Full keyboard operability for all interactive components; logical tab order; focus trap in modals/drawers
- **Screen reader support**: Semantic HTML, ARIA labels on all interactive elements, `aria-live` regions for dynamic content (new messages, notifications, toast announcements)
- **Reduced motion**: Respect `prefers-reduced-motion`; disable animations, simplify transitions, remove confetti effects

### 15.2 Specific Component Accessibility

| Component | ARIA Pattern |
|-----------|-------------|
| Swipe deck | `role="region"` with `aria-label="Profile cards"`, arrow key instructions |
| Chat thread | `role="log"` with `aria-live="polite"` for new messages |
| Filter chips | `role="group"` with `aria-label`, chips as `role="checkbox"` |
| Modal/Drawer | Focus trap, `aria-modal="true"`, `role="dialog"` |
| Tab navigation | `role="tablist"` / `role="tab"` / `role="tabpanel"` |
| Toast | `role="status"` with `aria-live="polite"` |
| Progress ring | `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |

### 15.3 Localization Support

- English and Hindi (matching mobile app)
- `next-intl` for i18n routing (`/en/`, `/hi/`)
- Default locale: English
- All user-facing strings extracted to message catalogs
- RTL not required (Hindi is LTR)

---

## 16. Error Handling Strategy

### 16.1 Error Hierarchy

```
AppError (base)
  |-- NetworkError          -- No connectivity, timeout, DNS failure
  |-- AuthError             -- 401, expired token, refresh failure
  |-- ServerError           -- 5xx with status code
  |-- NotFoundError         -- 404
  |-- ValidationError       -- 422 with field-level errors
  |-- RateLimitError        -- 429 with retry-after
  |-- ConflictError         -- 409 (duplicate action)
  |-- ForbiddenError        -- 403 (insufficient permissions)
  |-- UnknownError          -- Unmapped errors
```

### 16.2 Error Surfaces

| Surface | Component | Behavior |
|---------|-----------|----------|
| Page-level | `ErrorFallback` component | Full-page error with retry, back navigation, and status code |
| Page-level (CSR) | React Error Boundary | Error card with retry button, 200ms fade-in + slide-up animation |
| List/Grid empty | `EmptyState` component | Illustration + message + optional CTA, breathing icon animation |
| List/Grid loading | `Skeleton` component | Shimmer gradient placeholders (card/list/feed/profile variants) |
| API mutation failure | Toast notification | Error message with "Retry" action, auto-dismiss after 8s |
| Form field error | Inline below field | Red text with error icon, scroll to first error on submit |
| Network offline | Banner overlay | Persistent "You are offline" banner at top of viewport |
| Auth expired | Redirect to `/login` | Preserves redirect target, shows "Session expired" message |
| Realtime disconnect | Subtle indicator | Small icon in chat header indicating "Messages may be delayed" |

### 16.3 Banned Patterns

- No `error.toString()` or `err.message` direct display in UI
- No generic "Something went wrong" without contextual retry action
- No swallowing errors silently (always log to console in dev, analytics in prod)
- No `any` type for error objects

---

## 17. Analytics Events

### 17.1 Event Taxonomy

All events follow `object_action` naming with a consistent property schema:

| Event | Properties |
|-------|-----------|
| `page_viewed` | `page`, `referrer`, `auth_status`, `mode` |
| `listing_viewed` | `listing_id`, `source` (discover/search/map/swipe), `auth_status` |
| `listing_shared` | `listing_id`, `channel` (whatsapp/instagram/link) |
| `search_executed` | `query`, `filters_applied`, `result_count`, `search_type` |
| `search_saved` | `search_id`, `alert_enabled`, `alert_frequency` |
| `swipe_actioned` | `target_type`, `action`, `target_id`, `match_percentage`, `source` (keyboard/mouse/touch) |
| `profile_expanded` | `target_user_id`, `duration_seconds`, `scroll_depth`, `source` |
| `match_created` | `match_id`, `conversation_id`, `target_user_id`, `match_percentage` |
| `qna_completed` | `conversation_id`, `both_answered` |
| `message_sent` | `conversation_id`, `message_type`, `is_first_message` |
| `visit_scheduled` | `visit_id`, `conversation_id`, `context` |
| `visit_confirmed` | `visit_id`, `days_until_visit` |
| `listing_created` | `listing_id`, `steps_completed`, `time_spent_seconds` |
| `listing_published` | `listing_id` |
| `login_completed` | `method` (otp/password), `is_new_user` |
| `onboarding_completed` | `mode`, `total_time_seconds`, `steps_completed` |
| `filter_applied` | `filter_name`, `filter_value`, `page` |
| `alert_created` | `alert_id`, `frequency`, `channels` |
| `society_tag_voted` | `listing_id`, `tag`, `vote` |
| `error_occurred` | `error_type`, `error_code`, `page`, `context` |

### 17.2 Analytics Implementation

- `PostHog` for product analytics (event capture, session replay, feature flags)
- `Sentry` for error tracking and performance monitoring
- Analytics wrapper utility in `lib/analytics/` with typed event tracking
- Server-side page views tracked via client-side router events
- Client-side events tracked via `useEffect` + router events

---

## 18. Folder Structure

```
360-flatmates-web/
  src/
    app/                          # React Router v7 pages
      (public)/                   # Public route group (no auth required)
        LandingPage.tsx           # Landing page
        DiscoverPage.tsx          # Public listing browse
        ListingDetailPage.tsx     # Listing detail
        SearchPage.tsx            # Advanced search
        SemanticSearchPage.tsx    # Semantic search
        StatsPage.tsx             # City statistics
        ShareCardPage.tsx         # Share card redirect
        TermsPage.tsx             # Terms & Conditions
        PrivacyPage.tsx           # Privacy Policy
        AboutPage.tsx             # About 360 Flatmates
      (auth)/                     # Auth route group
        LoginPage.tsx             # Phone OTP + Password
        ForgotPasswordPage.tsx   # Password reset flow
      (app)/                      # Authenticated route group
        HomePage.tsx              # Personalized home feed
        SwipePage.tsx             # Swipe deck
        LikesPage.tsx             # Incoming likes
        ChatsPage.tsx             # Conversation list
        ChatThreadPage.tsx        # Chat thread
        ExplorePage.tsx           # Map view (authenticated)
        PostPage.tsx              # New listing builder
        PostReviewPage.tsx        # Listing review status
        ManageListingsPage.tsx    # Listing management
        DashboardPage.tsx         # Room Poster dashboard
        VisitsPage.tsx            # Visits list
        VisitDetailPage.tsx       # Visit detail
        ProfilePage.tsx           # Profile view/edit
        PublicProfilePage.tsx     # Public profile
        SettingsPage.tsx          # Settings
        BlockedUsersPage.tsx      # Blocked users list
        NotificationPrefsPage.tsx # Notification preferences
        NotificationsPage.tsx     # Notification center
        SavedSearchesPage.tsx     # Saved searches
        AlertsPage.tsx            # Search alerts
        OnboardingPage.tsx       # Multi-step onboarding
      (admin)/                    # Admin route group
        ListingReviewPage.tsx    # Listing review queue
        ReportReviewPage.tsx     # Report review queue
        PrescreenPage.tsx        # AI pre-screen
    components/
      ui/                         # Design system atoms
        button.tsx
        card.tsx
        chip.tsx
        input.tsx
        search-bar.tsx
        avatar.tsx
        badge.tsx
        progress-ring.tsx
        skeleton.tsx
        toast.tsx
        modal.tsx
        drawer.tsx
        bottom-sheet.tsx
        segmented-control.tsx
        step-progress.tsx
        price-text.tsx
        trust-badge.tsx
      molecules/                  # Composite components
        listing-card.tsx
        profile-grid-card.tsx
        conversation-row.tsx
        notification-card.tsx
        menu-item-row.tsx
        filter-panel.tsx
        swipe-action-bar.tsx
        chat-message-bubble.tsx
        visit-card.tsx
        match-context-card.tsx
        qna-card.tsx
        society-tag-vote-row.tsx
      organisms/                   # Feature-level components
        app-shell.tsx
        swipe-deck.tsx
        chat-thread.tsx
        listing-builder.tsx
        feed-section.tsx
        map-explorer.tsx
        search-results.tsx
        dashboard-panel.tsx
    lib/
      api/                        # API integration layer
        client.ts                 # Auth-aware fetch wrapper
        types.ts                  # OpenAPI-generated types
        queries/                   # TanStack Query hooks
        mutations/                 # TanStack Query mutations
      stores/                      # Zustand stores
        auth-store.ts
        onboarding-store.ts
        swipe-store.ts
        chat-store.ts
        ui-store.ts
        map-store.ts
        search-store.ts
      compatibility/               # 6-dimension scoring engine
        engine.ts                  # Weighted scoring algorithm
        dimensions.ts             # Dimension definitions and weights
        types.ts
      hooks/                       # Custom React hooks
        use-flatmates-realtime.ts  # Supabase Broadcast subscription
        use-keyboard-swipe.ts      # Keyboard shortcut handler
        use-optimized-scroll.ts   # Virtual scrolling for chat
        use-intersection-loader.ts # Infinite scroll pagination
        use-reduced-motion.ts      # prefers-reduced-motion
      analytics/                   # Analytics wrappers
        events.ts                  # Event name constants
        tracker.ts                 # PostHog + Sentry wrappers
      errors/                      # Error handling
        app-error.ts               # Error type hierarchy
        error-boundary.tsx         # React error boundary
      utils/                       # Utilities
        format.ts                  # Price, date, distance formatting
        cn.ts                       # Tailwind merge utility
        debounce.ts
      schemas/                     # Zod schemas
        onboarding.ts
        listing-builder.ts
        profile.ts
        visit.ts
        search.ts
      i18n/                        # Internationalization
        messages/
          en.json
          hi.json
        config.ts
    styles/
      globals.css                  # Tailwind directives + CSS custom properties
      fonts.css                    # Font-face declarations (Google Fonts CDN)
    App.tsx                        # Root app with React Router routes
    main.tsx                       # Entry point (Vite)
  public/
    icons/                         # PWA icons, favicons
    illustrations/                 # Empty state illustrations
    og/                            # OG image templates
  docs/
    flatmates-openapi.yaml         # OpenAPI 3.1.0 spec (source of truth)
  vite.config.ts
  tsconfig.json
  package.json
  .env.local                       # VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_BASE_URL
```

---

## 19. Environment Variables

All environment variables use the `VITE_` prefix (required by Vite to expose vars to client-side code).

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key (safe for client) |
| `VITE_API_BASE_URL` | Yes | FastAPI backend base URL (e.g., `https://api.360ghar.com/api/v1`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps JS API key for map view |
| `VITE_FCM_VAPID_KEY` | Yes | Firebase Cloud Messaging VAPID key for web push |
| `VITE_POSTHOG_KEY` | No | PostHog analytics API key |
| `VITE_POSTHOG_HOST` | No | PostHog host (self-hosted option) |
| `VITE_SENTRY_DSN` | No | Sentry DSN for error reporting |
| `VITE_APP_URL` | Yes | Canonical app URL (e.g., `https://flatmates.360ghar.com`) |
| `VITE_DEFAULT_CITY` | No | Default city for new users (default: `Bangalore`) |

Validation: Use `zod` to validate all env vars at app startup. Invalid/missing required vars should fail immediately with a clear error message.

---

## 20. Phased Rollout

### Phase 1 -- Foundation (Weeks 1-4)

**Goal:** Project scaffold, auth, bootstrap, public discovery surface.

- Vite + React Router v7 scaffold with TypeScript, Tailwind, Google Fonts CDN
- Design system atoms: Button, Card, Chip, Input, SearchBar, Avatar, Skeleton, Badge, ProgressRing
- Supabase Auth integration (Phone OTP + Password)
- Auth guard with route protection
- Bootstrap flow: `GET /flatmates/bootstrap` -> catalog loading -> profile check
- Public pages: Landing, Discover (listing browse), Listing Detail, City Stats
- API client with auth interceptor and error mapping
- OpenAPI type generation pipeline
- TanStack Query provider setup
- SEO: Meta tags, sitemap.xml, robots.txt, JSON-LD on listing pages
- FCM web push token registration

### Phase 2 -- Core Authenticated Experience (Weeks 5-8)

**Goal:** Full authenticated loop -- onboarding through chat.

- Onboarding flow (8 steps: splash, mode selection, location, basic info, photo, lifestyle quiz, budget/timeline, preferences & non-negotiables)
- Listing builder (8-step form with React Hook Form + Zod)
- Home feed with "Picked for You" and "New in City" sections
- Swipe deck (desktop-adapted with keyboard + mouse + action bar)
- Compatibility engine (6-dimension client-side scoring)
- Likes tab with profile grid cards and Match CTA
- Chat thread with Supabase Broadcast real-time updates
- Match flow with Q&A nudge
- Visit scheduling from chat
- Mode-dependent sidebar navigation
- Molecule and organism components: SwipeDeck, ChatThread, ListingBuilder, FeedSection
- Zustand stores: auth, onboarding, swipe, chat, UI
- Dark mode support

### Phase 3 -- Web-Specific Features (Weeks 9-12)

**Goal:** Desktop-optimized features that differentiate web from mobile.

- Advanced search page with 25+ filter panel (`GET /flatmates/web/search`)
- Saved searches CRUD (`/saved-searches`)
- Search alerts with email/push/in-app channels (`/alerts`)
- Room Poster Dashboard (`/dashboard`) with listing analytics
- Map view with server-clustered data (`GET /flatmates/web/map`)
- Share card generation (server-side via `GET /flatmates/web/listings/{id}/share-card`)
- Compatibility breakdown page
- Semantic search page
- Profile view duration tracking (`POST /flatmates/profile-views`)
- Society tag voting (`POST /flatmates/listings/{id}/society-tags/votes`)
- Notification center
- Settings: theme, palette, locale, privacy, blocked users

### Phase 4 -- Polish and Launch (Weeks 13-16)

**Goal:** Production readiness, performance, accessibility, monitoring.

- Accessibility audit and remediation (WCAG 2.1 AA)
- Performance optimization: code splitting (React.lazy), dynamic imports, bundle analysis
- Dark mode full test pass across all pages
- English + Hindi localization
- PostHog analytics integration
- Sentry error tracking
- Playwright E2E test suite for critical paths
- On-demand cache revalidation webhook
- Service worker for offline static asset caching (stretch)
- Load testing and CDN configuration
- Production deployment

---

## 21. Web-Specific UX Decisions

### 21.1 Swipe Deck on Desktop

The mobile swipe deck uses a card-stack with drag-to-swipe physics. On desktop, the interaction model adapts:

- **Primary card**: Centered in viewport (max-width 480px) on a neutral paper background
- **Keyboard controls**: Left arrow = Pass, Right arrow = Like, Up arrow = Super Like, Space = expand card, Escape = dismiss expanded view, Tab = navigate action bar buttons
- **Mouse controls**: Click action bar buttons, or click-and-drag card with snap-back animation (max 15 degrees rotation, threshold 20% of card width)
- **Expanded view**: Opens as a right-side drawer panel (desktop) or full-screen overlay (tablet/mobile), showing full profile with sections (Society, Room, Flat, Costs, About Me, Society Insights, Compatibility Breakdown)
- **Card count indicator**: "3 of 12 remaining" shown below the deck
- **Empty deck state**: Illustrated empty state with "Check back later for new profiles" message

### 21.2 Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Bottom nav (5 tabs), full-screen pages, stacked layout |
| Tablet | 768-1023px | Collapsed sidebar (64px icons only), two-column where applicable |
| Desktop | 1024-1439px | Sidebar nav (240px), content area, expanded drawer |
| Wide | >= 1440px | Sidebar nav (280px), content area with max-width 1200px, side panels |

### 21.3 Sidebar Navigation (Desktop)

- **Room Poster**: Home | Post & Manage | Swipe | Likes | Chats | Dashboard | Profile
- **Co-Hunter / Open to Both**: Home | Explore | Swipe | Likes | Chats | Profile
- Collapsible to icon-only mode (64px width) on toggle
- Active item: terracotta text + icon, terracotta `primary/14` background
- Logo at top: "360 FLATMATES" in compact mode
- User avatar + name + mode badge at bottom, links to profile

### 21.4 Chat Thread Desktop Layout

On desktop (>= 1024px), chats use a split layout:
- **Left panel** (320px): Conversation list with search, unread badges
- **Right panel** (flex): Active chat thread with match context card, messages, input

On mobile, conversation list and chat thread are separate routes.

### 21.5 Search Panel Desktop Layout

On desktop, the search page uses a three-panel layout:
- **Left sidebar** (280px): Filter panel with all 25+ filters, collapsible sections
- **Center**: Search results grid (2-3 columns of listing cards)
- **Right** (optional): Map preview panel (toggleable)

On mobile, filters collapse into a bottom sheet, results are single-column.

### 21.6 Map View Adaptation

- Mobile uses Flutter Map with client-side clustering
- Web uses `@react-google-maps/api` or `vis.gl/react-google-maps` with server-clustered data from `GET /flatmates/web/map`
- Cluster markers: colored circles with count (orange = Room Available, blue = Co-Hunter)
- Click cluster: zoom in and reveal sub-clusters/pins
- Click pin: info window with mini-card (photo, title, rent, compatibility %, "View" CTA)
- Filter bar above map: budget range, sharing type, move-in timeline
- Zoom level sent to API for cluster granularity control

### 21.7 Keyboard Shortcuts Summary

| Shortcut | Context | Action |
|----------|---------|--------|
| `Left` | Swipe deck | Pass |
| `Right` | Swipe deck | Like |
| `Up` | Swipe deck | Super Like |
| `Space` | Swipe deck | Expand current card |
| `Esc` | Any overlay | Dismiss/close |
| `/` | Any page | Focus search bar |
| `Cmd/Ctrl+K` | Any page | Open command palette (stretch) |
| `Enter` | Chat input | Send message |
| `Shift+Enter` | Chat input | New line |

### 21.8 Dark Mode and Theme Switching

- **CSS custom properties** for all design tokens, switched via `[data-theme="dark"]` attribute on `<html>`
- **Tailwind dark mode**: `darkMode: 'class'` strategy
- **Three palettes** (matching mobile): default (terracotta/coral), ember, monsoon teal
- System preference detection via `prefers-color-scheme`
- Theme persisted in localStorage, synced to Zustand UI store
- Dark mode tokens: warm charcoal scaffold (`#1A1612`), dark surface (`#2A2520`), elevated surface (`#342E28`), lightened ink text, reduced shadows, slightly increased border alpha

### 21.9 Touch and Pointer Interactions

- **Press feedback**: All interactive elements scale to 0.97 on `pointerdown` (CSS `:active` + `transition: transform 150ms ease-out`)
- **Hover states**: Desktop-only hover effects (card lift, shadow deepen, border glow) that do not appear on touch devices
- **Selection spring**: Filter chips scale to 1.03 on selection with `cubic-bezier(0.34, 1.56, 0.64, 1)` (easeOutBack)
- **Focus glow**: Search bar and focused inputs gain terracotta box-shadow + subtle 1.01 scale
- **Drag-to-swipe**: Pointer events for card drag with physics (rotation proportional to horizontal offset, shadow deepens on lift)

### 21.10 Mouse-First vs Touch-First Decisions

| Component | Desktop (Mouse) | Mobile (Touch) |
|-----------|----------------|----------------|
| Swipe actions | Keyboard + drag + action bar buttons | Swipe gesture + action bar buttons |
| Expanded profile | Right-side drawer | Full-screen overlay |
| Filters | Left sidebar panel | Bottom sheet |
| Navigation | Persistent sidebar | Bottom tab bar |
| Chat layout | Split view (list + thread) | Separate routes |
| Map interactions | Hover info windows, scroll zoom | Tap pins, pinch zoom |
| Context menus | Right-click menus (stretch) | Long-press (stretch) |
| Tooltips | Hover tooltips on info icons | Tap to reveal |

---

## 22. Terminology Glossary

User-facing and technical terms map as follows:

| User-Facing | API / Technical | OpenAPI Schema |
|------------|-----------------|----------------|
| Listing | Property | Property, PropertyCreate |
| Flatmate | Profile | FlatmatesProfile |
| Save | Like (swipe action) | SwipeRequest.action=like |
| Mode | FlatmatesMode | room_poster, co_hunter, open_to_both |
| Society Type | society_type | gated, independent, co_living, pg |
| Room Type | sharing_type | private_room, shared_room, master_bedroom, entire_flat |
| Gender Preference | gender_preference | male, female, any |
| Visit Context | context | property_tour, flatmate_meet |

**Convention**: Use "listing" in all user-facing UI/UX text. Use "property" in API/technical PRD sections, code, and endpoint paths.

---

## 23. Security Headers

Security headers are set via the Vite server and/or CDN/edge layer on all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.supabase.co https://*.googleapis.com; connect-src 'self' https://*.supabase.co https://*.posthog.com https://*.sentry.io wss://*.supabase.co; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'` | Prevent XSS, data injection |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Force HTTPS |
| Referrer-Policy | strict-origin-when-cross-origin | Limit referrer leakage |
| Permissions-Policy | camera=(), microphone=(), geolocation=(self) | Limit browser API access |

---

## 24. CORS Specification

The web app (frontend) calls a separate FastAPI backend. CORS configuration:

| Setting | Value |
|---------|-------|
| Allowed Origins (Production) | `https://360flatmates.com`, `https://flatmates.360ghar.com` |
| Allowed Origins (Development) | `http://localhost:3000`, `http://localhost:3001` |
| Allowed Methods | GET, POST, PUT, DELETE, OPTIONS |
| Allowed Headers | Authorization, Content-Type, X-Request-ID |
| Credentials | true |
| Max Age | 86400 (preflight cache) |

---

## 25. CI/CD Pipeline

### 25.1 GitHub Actions CI

On every pull request:
- **Lint**: ESLint with zero warnings
- **Type-check**: `tsc --noEmit`
- **Unit tests**: Vitest with coverage threshold (>70%)
- **Build**: `next build` succeeds
- **Lighthouse CI**: Performance budget (LCP < 2.5s, CLS < 0.1)

### 25.2 Deployment

- **Preview**: Per-PR deployment on Vercel preview URL
- **Production**: Deploy on merge to `main` branch
- **Branch naming**: `feature/*`, `fix/*`, `chore/*`
- **On-demand cache revalidation**: Supabase Broadcast `listing_status_changed` event from FastAPI on listing status change triggers TanStack Query invalidation

### 25.3 Environment Strategy

| Environment | API Base URL | Supabase Project |
|-------------|-------------|------------------|
| Local | `http://localhost:8000/api/v1` | Dev project |
| Preview | `https://staging-api.360ghar.com/api/v1` | Staging project |
| Production | `https://api.360ghar.com/api/v1` | Production project |

---

## 26. Search Debouncing

| Input Type | Debounce | Rationale |
|------------|----------|-----------|
| Search text input | 300ms | Fast enough to feel responsive, avoids excessive API calls |
| Filter changes | Immediate | URL sync is cheap; API call fires immediately |
| Semantic search | 500ms | Heavier vector search, needs longer debounce |

---

## Appendix A: Design Token Mapping (Mobile -> Web)

All color tokens, typography, border radii, spacing, shadows, gradients, frost effects, and animation durations from the mobile `DESIGN.md` map directly to CSS custom properties in the web app. Key mappings:

- **Colors**: Direct hex/rgba values as CSS custom properties on `:root` and `[data-theme="dark"]`
- **Typography**: Google Fonts CDN loads Fraunces (variable), Inter, JetBrains Mono, Instrument Serif; Tailwind v4 `@theme` directive maps to CSS variables; Fraunces variable settings (`opsz`, `SOFT`, `WONK`) applied via `font-variation-settings` utility class
- **Border radius**: CSS custom properties with design token names in `@theme`
- **Spacing**: CSS custom properties with design token names in `@theme`
- **Shadows**: CSS custom properties with design token names in `@theme` (warm ink tints, terracotta-tinted CTA shadows)
- **Animation**: CSS keyframes + custom properties with design token names in `@theme`
- **Frost/Glassmorphism**: `backdrop-filter: blur(3px)` + semi-transparent background

## Appendix B: Compatibility Engine (Web Implementation)

The 6-dimension weighted scoring engine runs identically on web as on mobile:

| Dimension | Weight | Scoring |
|-----------|--------|---------|
| Sleep Schedule | 20% | Exact match = 100, Adjacent = 50, Opposite = 0 |
| Cleanliness | 20% | 0 gap = 100, 1 gap = 50, 2 gap = 0 |
| Food Habits | 15% | Veg/Vegan strict match = 100, Non-veg + non-veg = 100, Mismatch with strict veg = 0 |
| Smoking/Drinking | 20% | Non-smoker + non-smoker = 100, One smokes = 30, Both = 100 |
| Guests Policy | 15% | Exact match = 100, One step apart = 60, Two steps = 20 |
| Work Style | 10% | WFH + WFH = 100, Office + Office = 100, Mixed = 70 |

Result: single percentage + color (green >= 70%, amber 40-69%, red < 40%) + per-dimension breakdown with match/mismatch indicators.

Client-side calculation from cached profile data. No server call per swipe. The server endpoint `GET /flatmates/web/compatibility/{user_id}` is used for the dedicated compatibility breakdown page, not per-card computation.

---

### Critical Files for Implementation

- `/Users/sakshammittal/Documents/360ghar/github/360ghar/360-flatmates-web/docs/flatmates-openapi.yaml` -- The OpenAPI 3.1.0 spec with all 38 endpoints and 70+ schemas; source of truth for type generation and API client implementation
- `/Users/sakshammittal/Documents/360ghar/github/360ghar/360-flatmates/DESIGN.md` -- Complete design system (color tokens, typography, components, animations, screen-by-screen specs) that must be faithfully ported to web CSS/Tailwind
- `/Users/sakshammittal/Documents/360ghar/github/360ghar/360-flatmates/docs/prd.md` -- Product requirements document with personas, user modes, onboarding flow, core features, chat system, trust and safety, and feature priority matrix
- `/Users/sakshammittal/Documents/360ghar/github/360ghar/360-flatmates/docs/flatmates_technical_spec.md` -- Backend architecture, data model, API surface, chat/match behavior, and catalog strategy; informs the API integration layer design
- `/Users/sakshammittal/Documents/360ghar/github/360ghar/360-flatmates/CLAUDE.md` -- Mobile architecture patterns (Riverpod state, GoRouter, Dio interceptors, error handling, shared component library) that inform web equivalents

---

## Verification

1. **Type Generation**: Run `openapi-typescript docs/flatmates-openapi.yaml -o lib/api/types.ts` and verify no errors
2. **Auth Flow**: Test phone OTP login -> bootstrap -> onboarding redirect -> home feed cycle
3. **Public SEO**: Verify listing pages are indexable (view page source, check meta tags, JSON-LD, canonical URLs)
4. **Realtime Broadcast**: Verify real-time events flow (new message appears in chat, match notification shows toast)
5. **Swipe Deck**: Test keyboard shortcuts (Left/Right/Up), mouse drag, expanded drawer
6. **Responsive**: Test at 375px (mobile), 768px (tablet), 1280px (desktop), 1440px (wide)
7. **Dark Mode**: Toggle dark mode, verify all pages render with warm charcoal palette
8. **Lighthouse**: Run Lighthouse audit, verify LCP < 2.5s, FID < 100ms, CLS < 0.1
9. **Accessibility**: Run axe audit, verify no WCAG 2.1 AA violations
10. **API Integration**: Verify all 43 endpoints are callable with correct auth, pagination, and error handling
