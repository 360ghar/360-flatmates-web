# Features

Features are cross-cutting user-visible and developer-visible capabilities. They span multiple systems and primitives, so each feature page traces through the API client, server-state hooks, stores, and components that make it work.

## Compatibility and matching

- [Compatibility matching](compatibility-matching/index.md) - the six-dimension lifestyle engine, scoring, and ranking. Includes a sub-page on the [swipe deck](compatibility-matching/swipe-deck.md).
- [Likes and matches](likes-and-matches.md) - the incoming-likes and matches inboxes, unmatch flow, SSE-driven refetch.

## Communication

- [Messaging](messaging.md) - conversation list, chat thread, optimistic send, SSE invalidation.
- [Visits](visits.md) - visit scheduling lifecycle, host and seeker views, status transitions.

## Listing and management

- [Listing management](listing-management.md) - the room poster flow: post, review, manage, edit, boost, renew.
- [Dashboard and analytics](dashboard-analytics.md) - room poster metrics, per-listing analytics, public stats.
- [Admin moderation](admin-moderation.md) - moderation queue for listings and reports, prescreen review.

## Discovery

- [Search and explore](search-explore.md) - authenticated search, semantic search, map explore, saved searches.
- [Public discover](discover.md) - the unauthenticated marketing surface: landing, discover feed, city pages, blog, comparison.

## Account and onboarding

- [Profile and onboarding](profile-onboarding.md) - profile edit, onboarding wizard, choose-role, gate progression.
- [Auth flows](auth-flows.md) - Supabase auth, gate states, token refresh, mid-auth-flow handling.

## Infrastructure

- [Real-time updates](real-time.md) - SSE connection manager, twelve event types, BroadcastChannel dedup.
- [Push notifications](push-notifications.md) - FCM web push, VAPID, notification preferences, search alerts.
- [SEO and prerendering](seo-prerendering.md) - build-time prerendering, sitemap, JSON-LD, meta tags.
- [PWA and install](pwa-install.md) - service worker, manifest, install banner, iOS guide.
