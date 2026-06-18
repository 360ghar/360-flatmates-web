# REST endpoints

Active contributors: Saksham

The 360 Flatmates web SPA talks to a single FastAPI backend mounted at `/api/v1`. The authoritative contract is [`docs/flatmates-openapi.yaml`](../../docs/flatmates-openapi.yaml), a single OpenAPI 3.1 file that defines every path, request body, response shape, status code, and enum. This page is a summary of that contract: the base URL, the domain groups, the type generation pipeline, and the primary operations per group. When this page and the spec disagree, the spec wins, and this page needs updating.

## Base URL and transport

The base URL is resolved once by `resolveBaseUrl()` in `src/lib/api/client.ts`, defaulting to `getEnv().VITE_API_BASE_URL` (for example `https://api.360ghar.com/api/v1`). Trailing slashes are stripped so paths join cleanly. Every call goes through the `HttpApiClient`, which:

- builds the URL with `buildApiUrl(baseUrl, path, query)`, serializing `query` with `URLSearchParams` (dropping `undefined`, `null`, and empty strings, and repeating array keys so `amenities=WiFi&amenities=Parking` round-trips),
- injects `Accept: application/json`, `Content-Type: application/json` when a body is present, and `Authorization: Bearer <access_token>` on authenticated requests,
- runs the 401 refresh-and-retry cycle on stale tokens, and
- normalizes every non-2xx response into an `ApiClientError` carrying a tagged `AppError`.

See [API client](../systems/api-client.md) for the full client mechanics. The spec's `servers` block also publishes a local-development server at `http://localhost:8000/api/v1`; in dev the Vite proxy at `/api` rewrites to the configured backend (see [Getting started](../overview/getting-started.md)).

## Endpoint groups

The spec tags every operation, and the tags cluster into eleven domain groups. The table below maps each group to its tag, the primary operations it exposes, and the domain type file under `src/lib/api/` that holds the request and response shapes. The "primary operations" column lists representative endpoints, not every variant; consult the spec for parameters and edge cases.

| Group | Spec tag | Primary operations | Domain type file |
| --- | --- | --- | --- |
| Auth and session | `Auth` | `GET /users/me`, `DELETE /users/me`, `GET /users/location`, `POST /flatmates/auth/reset-password` (public), plus the login-state helpers `POST /auth/identifier-status` (public), `POST /auth/last-method`, `GET /users/me/auth-state` | `src/lib/api/auth.ts`, `src/lib/api/user.types.ts` |
| Bootstrap | `Bootstrap` | `GET /flatmates/bootstrap` (profile, catalogs, and activity counts in one call) | `src/lib/api/user.types.ts` (`FlatmatesBootstrap`) |
| Catalogs | `Catalogs` | `GET /flatmates/catalogs` (server-driven business metadata: modes, timelines, dimensions, vibe tags, report reasons, room types, furnishing options) | `src/lib/api/common.types.ts` (`CatalogEntry`, `CatalogsResponse`) |
| Profiles | `Profiles` | `GET /flatmates/profile`, `PUT /flatmates/profile`, `GET /flatmates/profiles` (discoverable peers for the swipe deck) | `src/lib/api/user.types.ts` |
| Swipes | `Swipes` | `POST /flatmates/swipes`, `DELETE /flatmates/swipes/last` | `src/lib/api/search.types.ts` (`SwipeRequest`, `SwipeResult`, `SwipeHistoryItem`) |
| Likes and matches | `Likes`, `Matches` | `GET /flatmates/likes`, `GET /flatmates/matches`, `PUT /flatmates/matches/{match_id}/unmatch` | `src/lib/api/match.types.ts` |
| Conversations | `Conversations` | `GET /flatmates/conversations`, `GET /flatmates/conversations/{id}`, `GET .../messages`, `POST .../messages`, `POST .../mark-read`, `POST .../qna` | `src/lib/api/conversation.types.ts` |
| Visits | `Visits` | `POST /visits`, `GET /visits/upcoming`, `GET /visits/past`, `PUT /visits/{id}`, `POST /visits/{id}/reschedule`, `POST /visits/{id}/cancel`, `POST /visits/{id}/complete` | `src/lib/api/visit.types.ts` |
| Listings | `Listings` | `POST /properties`, `GET /properties` (search), `GET /properties/semantic-search`, `GET /properties/recommendations`, `GET /properties/me`, `GET /properties/{id}`, `PUT /properties/{id}`, `DELETE /properties/{id}`, `POST /properties/{id}/boost`, `POST /properties/{id}/renew` | `src/lib/api/property.types.ts` |
| Notifications | `Notifications` | `GET /flatmates/notifications`, `PUT /flatmates/notifications/{id}`, `POST /notifications/devices/register`, `POST /notifications/devices/unregister` | `src/lib/api/notification.types.ts`, `src/lib/api/common.types.ts` (`RegisterDevicePayload`) |
| Blocks and reports | `Blocks & Reports` | `GET /flatmates/blocks`, `POST /flatmates/blocks`, `DELETE /flatmates/blocks/{blocked_user_id}`, `POST /flatmates/reports` | `src/lib/api/user.types.ts` (`ReportCreate`, `ReportOut`) |
| Interactions | `Interactions` | `POST /flatmates/profile-views`, `POST /flatmates/listings/{listing_id}/society-tags/votes` | `src/lib/api/user.types.ts` (`ProfileViewEventCreate`, `SocietyTagVoteCreate`) |
| Real-time | `SSE` | `GET /flatmates/sse` (the event stream; token passed as a query param because the `EventSource` API cannot set headers, see [Real-time](../features/real-time.md) and [Security](../security.md)) | `src/lib/sse/types.ts` |
| Admin moderation | `Admin Moderation` | `GET /flatmates/moderation/listings`, `PUT /flatmates/moderation/listings/{id}`, `GET /flatmates/moderation/reports`, `PUT /flatmates/moderation/reports/{id}`, `POST /flatmates/moderation/prescreen/{id}` | `src/lib/api/admin.types.ts` |
| Web discovery | `Web Discovery` | `GET /flatmates/web/search`, `GET/POST /flatmates/web/saved-searches`, `GET/PUT/DELETE /flatmates/web/saved-searches/{id}`, `POST .../run`, `GET/POST /flatmates/web/alerts`, `GET/PUT/DELETE /flatmates/web/alerts/{id}`, `GET /flatmates/web/map`, `GET /flatmates/web/stats`, `GET /flatmates/web/listings/{id}/share-card`, `GET /flatmates/web/listings/{id}/analytics`, `GET /flatmates/web/dashboard`, `GET /flatmates/web/compatibility/{user_id}` | `src/lib/api/search.types.ts`, `src/lib/api/property.types.ts`, `src/lib/api/match.types.ts` |

The `GET /flatmates/web/search` endpoint is the one public web discovery call (it works for signed-out visitors and crawlers and is requested with `auth: false` on the client). Everything else requires a bearer token.

## How types are generated

TypeScript types are generated from the OpenAPI spec in two complementary layers.

1. **Generated raw types.** `npm run generate:api-types` runs `openapi-typescript docs/flatmates-openapi.yaml -o src/lib/api/openapi-types.ts`, producing a deeply-nested `paths` and `components.schemas` object the rest of the codebase can `interface paths`-style import from. Re-run this whenever the spec changes, then commit the regenerated file. See [Getting started](../overview/getting-started.md) for the command list.
2. **Hand-curated domain type files.** The domain type files in `src/lib/api/*.types.ts` (`common`, `user`, `property`, `conversation`, `visit`, `search`, `match`, `notification`, `admin`) are the types actually consumed by hooks and components. They are hand-curated, named in the shapes the UI wants, and import their enum values from `src/lib/data` (the canonical string unions). Enum values are the contract; the domain files restate the shapes around them.

The hand-curated layer exists because the raw generated types are verbose and path-keyed, while the UI needs flat, named interfaces (`Property`, `FlatmatesPeer`, `ConversationSummary`, `Visit`, etc.) that compose cleanly into component props. The two layers are kept consistent by convention: when a backend field changes, regenerate the raw types, then update the matching domain file in the same change.

## Backward-compat re-export

`src/lib/api/types.ts` is a barrel that re-exports every domain type file:

```ts
export * from "./common.types";
export * from "./user.types";
export * from "./property.types";
export * from "./conversation.types";
export * from "./visit.types";
export * from "./search.types";
export * from "./match.types";
export * from "./notification.types";
export * from "./admin.types";
```

It exists for backward compatibility: older code imports domain types from `@/lib/api/types` (or `@/lib/api`), while newer code imports directly from the domain file. Both paths resolve to the same types. New code should import from the specific domain file (for example `@/lib/api/property.types`) so refactors stay local, but the barrel is safe to keep.

## Adapters

`src/lib/api/adapters.ts` is the bridge between the raw API shapes and the component prop shapes. It exports pure functions like `propertyToListingCardProps`, `profileToProfileGridCardProps`, `conversationToConversationRowProps`, `visitToVisitCardProps`, `notificationToNotificationCardProps`, and `messageToChatBubbleProps`. They live next to the types because they are the only place that knows both the API shape and the component prop shape, and they keep mapping logic out of components and hooks. See [API client](../systems/api-client.md) for where they sit in the data flow.

## How calls are made

Every call is a TanStack Query hook in `src/hooks/queries/`. Each hook wraps `apiClient.request({ method, path, query, body })`, owns its query key, and returns typed data plus `isLoading`, `error`, and `refetch`. There is one hook file per domain (`useProfiles`, `useProperties`, `useConversations`, `useVisits`, `useSearch`, `useMatches`, `useNotifications`, `useAdmin`, `useSwipes`, `useBlocks`, `useReports`, `useCatalogs`, `useSocietyTags`, `useProfileViews`, `useMapView`, `useDashboard`, `useCompatibility`, `useShareCard`, `useBootstrap`). Server state is never mirrored into Zustand; see [Server state](../systems/server-state.md) for the cache contract and [data models](../reference/data-models.md) for the shapes themselves.

## Public versus authenticated

The spec marks operations as `security: []` (public) or `security: [{ BearerAuth: [] }]` (authenticated). The client mirrors this with the `auth` flag on `ApiRequest`, defaulting to `true`. Public endpoints the client hits with `auth: false` include `GET /properties` (the discover feed), `GET /flatmates/web/search`, `POST /auth/identifier-status`, and `POST /flatmates/auth/reset-password`. The `auth: false` flag skips the `Authorization` header entirely so public surfaces work for signed-out visitors and prerendering bots.

## Related pages

- [API](index.md) for the section overview.
- [API client](../systems/api-client.md) for `HttpApiClient`, URL building, the 401 refresh-and-retry flow, and error normalization.
- [Data models](../reference/data-models.md) for the entity reference (Property, FlatmateProfile, Conversation, Visit, etc.).
- [Dependencies](../reference/dependencies.md) for the runtime and dev dependency inventory.
- [`docs/flatmates-openapi.yaml`](../../docs/flatmates-openapi.yaml), the source of truth.

## Key source files

| File | Role |
| --- | --- |
| `docs/flatmates-openapi.yaml` | The OpenAPI 3.1 contract; source of truth for paths, bodies, responses, enums |
| `src/lib/api/client.ts` | `HttpApiClient`, `buildApiUrl`, the `ApiAdapter` interface, the 401 refresh-and-retry loop |
| `src/lib/api/errors.ts` | `ApiClientError`, `AppError`, `mapStatusToAppError`, `toAppError`, `isAppError` |
| `src/lib/api/index.ts` | Module-level token/refresh singletons, the `apiClient` singleton, `setAccessToken` and `setRefreshTokenHandler` |
| `src/lib/api/adapters.ts` | API-shape to component-prop mappers (`propertyToListingCardProps`, `visitToVisitCardProps`, etc.) |
| `src/lib/api/auth.ts` | Auth-domain helpers: `checkIdentifierStatus`, `reportLastMethod`, `getAuthState` |
| `src/lib/api/types.ts` | Barrel re-export of every domain type file for backward compatibility |
| `src/lib/api/common.types.ts` | `CatalogEntry`, `CatalogsResponse`, `RegisterDevicePayload`, `ShareCardResponse` |
| `src/lib/api/user.types.ts` | `User`, `FlatmatesProfile`, `FlatmatesPeer`, `FlatmatesBootstrap`, report and society-tag types |
| `src/lib/api/property.types.ts` | `Property`, `PropertyCreate`, `PropertyUpdate`, dashboard and analytics shapes |
| `src/lib/api/conversation.types.ts` | `ConversationSummary`, `MessageOut`, `MessageListResponse`, QnA state |
| `src/lib/api/visit.types.ts` | `Visit`, `VisitCreate`, `VisitUpdate`, reschedule/cancel/complete payloads |
| `src/lib/api/search.types.ts` | `SearchFilters`, `WebSearchResponse`, `SavedSearch`, `SearchAlert`, map and swipe types |
| `src/lib/api/match.types.ts` | `MatchSummary`, `IncomingLikeSummary`, `CompatibilityBreakdown` |
| `src/lib/api/notification.types.ts` | `FlatmatesNotification`, mark-read payloads, filters |
| `src/lib/api/admin.types.ts` | Moderation and report admin shapes, `AdminStats`, `DashboardStats` |
| `src/hooks/queries/` | One TanStack Query hook file per domain; the only callers of `apiClient.request` |
