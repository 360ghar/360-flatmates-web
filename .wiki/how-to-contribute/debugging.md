# Debugging

Active contributors: Saksham

Common errors in the 360 Flatmates web app and how to fix them. Each entry maps a symptom to the likely cause and the concrete fix, with pointers to the code that implements the behavior. For the conventions your code must follow, see [patterns and conventions](patterns-and-conventions.md). For setup, see [Getting started](../overview/getting-started.md).

## The error model

The API client in `src/lib/api/client.ts` throws `ApiClientError` (defined in `src/lib/api/errors.ts`) for every non-2xx response. The error carries an `AppError` discriminated union with eight types:

| `type` | Triggered by | Typical message |
| --- | --- | --- |
| `network` | `TypeError` from `fetch` (offline, CORS, DNS) | `Network request failed` |
| `auth` | HTTP 401 or 403 | The backend's `detail` string |
| `not_found` | HTTP 404 | The backend's `detail` string |
| `validation` | HTTP 400 or 422 | The backend's `detail`, with a `fields` map |
| `rate_limit` | HTTP 429 | The backend's `detail`, with optional `retryAfter` |
| `conflict` | HTTP 409 | The backend's `detail` string |
| `server` | HTTP 5xx | The backend's `detail` string, with `status` |
| `unknown` | Anything else | The error message or `Something went wrong` |

Use `toAppError(unknown)` to normalize a thrown value into an `AppError` before rendering it. The `<ErrorState>` component reads the `message`. For the full client internals (the 401 refresh flow, header building, query serialization), see [API client](../systems/api-client.md).

## Common scenarios

### "Illegal invocation" on fetch

**Symptom:** Console shows `TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation`, often after a module reload or in a test environment.

**Cause:** The `HttpApiClient` constructor binds the fetcher with `fetch.bind(window)`. If something replaces or unwraps the bound reference, `fetch` is invoked without its `window` receiver and the browser rejects the call.

**Fix:** The client already binds at construction (`this.fetcher = options.fetcher ?? fetch.bind(window)` in `src/lib/api/client.ts`). If you inject a custom `fetcher`, do not pass a bare `fetch` reference. Pass an arrow wrapper: `fetcher: (...args) => fetch(...args)`, or pass a `vi.fn` in tests. Never reassign `window.fetch` without rebinding.

### 401 retry cascade on public pages

**Symptom:** A public page (for example `/discover/:id`) fires a request, gets a 401, the client calls `onAuthFailure`, Supabase refreshes, the request retries, and this repeats or logs the user out.

**Cause:** The request did not opt out of auth. The client attaches the `Authorization` header whenever `req.auth !== false`. On public pages the token may be missing or stale, so the backend returns 401 and the refresh path kicks in unnecessarily.

**Fix:** Mark public endpoints with `auth: false` in the request. In the hook that calls the public route, pass `{ auth: false }` to the `apiClient.request` call. The client then skips the token lookup, the header, and the refresh path entirely. See [API client](../systems/api-client.md) for the request shape.

### Env validation failure

**Symptom:** The app throws at startup: `Missing or invalid environment variables:` followed by a list of paths like `- VITE_API_BASE_URL: Invalid url` or `- VITE_SUPABASE_PUBLISHABLE_KEY: Required`.

**Cause:** `src/lib/env.ts` runs the `import.meta.env` object through a Zod schema on first access (via `getEnv()`). Vite only exposes variables prefixed with `VITE_` to the client bundle, and the schema requires `VITE_API_BASE_URL` (a URL), `VITE_SUPABASE_URL` (a URL), and `VITE_SUPABASE_PUBLISHABLE_KEY` (non-empty). `VITE_VAPID_PUBLIC_KEY` is optional.

**Fix:** Check your `.env` (or `.env.local`) file. Confirm every required key is present, the URL fields are valid URLs (no trailing path surprises), and the file is not gitignored into oblivion. Restart the dev server after editing `.env`, because Vite reads env at startup. See [Getting started](../overview/getting-started.md) for the full variable table.

### Auth loading stuck

**Symptom:** The app sits on a loading screen, `authStore.loading` never flips to `false`, and guarded routes never resolve.

**Cause:** `initAuthSubscription()` in `src/hooks/useAuth.ts` calls `supabase.auth.getSession()` and only clears loading in its `.then` or `.catch`. If that promise hangs (a network-blocked Supabase request, a hung refresh), the UI is stuck.

**Fix:** There is a 5-second safety timeout built in: a `setTimeout` that calls `authStore.getState().setLoading(false)` after 5000ms regardless of whether `getSession` has resolved. If you still see a stuck loader, check that the timeout was not removed, that `authStore` is the same instance the timeout writes to, and that a route guard is not separately blocking on a query. In dev, you can also force a test session via `localStorage["flatmates-playwright-auth"] = "true"` and reload. For the full auth flow, see [auth flows](../features/auth-flows.md).

### SSE not connecting

**Symptom:** Real-time updates (notifications, chat, visit status) stop arriving, or the connection indicator stays on `disconnected` or `reconnecting`.

**Cause:** The `SSEConnectionManager` in `src/lib/sse/connection.ts` connects only when it can fetch a non-null token from `getToken()`. If the token is null, it sets state to `Disconnected` and returns without opening an `EventSource`. If the connection opens but no events arrive within `HEARTBEAT_TIMEOUT_MS` (60s), the manager tears down and reconnects with exponential backoff (1s, 2s, 4s, 8s, 16s, capped at 30s). After 3 consecutive auth failures (the `EventSource` errored before `open`), it calls `onAuthFailure` to refresh the token.

**Fix, in order:**

1. Confirm the user is signed in and `getToken()` resolves to a non-null JWT. An expired or null token is the most common cause.
2. Confirm the backend SSE endpoint is up and sending heartbeats. The manager reconnects if no event (including `ping`) arrives within 60s.
3. Watch the backoff. If you see repeated `Reconnecting` state, the endpoint may be rejecting the token in the query string (the `EventSource` API cannot send headers, so the token rides on `?token=...`). Confirm `Referrer-Policy: no-referrer` is set so the token does not leak via `Referer`.
4. In tests, mock the manager as shown in [testing](testing.md); a real `EventSource` will not fire in jsdom.

For the production wiring and the multi-tab dedup, see [real-time](../features/real-time.md).

### Dev proxy not working

**Symptom:** API calls from the dev server return 404, hit the wrong path, or fail CORS.

**Cause:** `vite.config.ts` proxies `/api` to `https://api.360ghar.com` with `changeOrigin: true` and rewrites the path from `/api` to `/app/v1`. A call to `/api/v1/users/me` becomes `https://api.360ghar.com/app/v1/v1/users/me` if the client also prefixes `/v1`, which 404s.

**Fix:** Confirm the client calls relative paths (the base URL is resolved by the client, not hardcoded). Confirm the rewrite is in place: the proxy strips `/api` and prepends `/app/v1`. If you are hitting a different backend, update the `target` in `vite.config.ts`, not the app code. See [Getting started](../overview/getting-started.md) "Dev server proxy".

### Playwright auth state stale

**Symptom:** The `authenticated` Playwright project fails every test with a redirect to `/login`, or with a cookie error.

**Cause:** The storage state at `.auth/user.json` is stale or missing. The `auth-setup` project writes it, and the `authenticated` project reads it. If the Supabase project URL changed, the cookie name (`sb-<projectRef>-auth-token`) changed too, and the old file no longer matches. If `auth-setup` failed silently (no backend), the file may have an injected fake cookie that no longer parses.

**Fix:** Delete `.auth/user.json` and re-run `npm run test:e2e`. The `auth-setup` project runs first and regenerates the file. The `.auth/` directory is gitignored, so this is always a local rebuild. See [testing](testing.md) for the project dependency order.

### Unit test hangs on a framer-motion component

**Symptom:** A component test that renders a `motion.div` or `AnimatePresence` hangs or times out.

**Cause:** The framer-motion mock was not picked up. The alias lives in `vitest.config.ts`; if the test is run outside the Vitest config (for example via a bare `node` or a different runner), the real framer-motion loads and waits on animation frames that jsdom never fires.

**Fix:** Run tests through `npm test` or `npx vitest`, which use `vitest.config.ts`. Do not import real framer-motion in a test. See [testing](testing.md) for the mock.

## Troubleshooting table

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Illegal invocation` on fetch | `fetch` invoked without its `window` receiver | Keep the `fetch.bind(window)` in the client, or pass an arrow wrapper as `fetcher` |
| 401 retry loop on a public page | Request did not set `auth: false` | Pass `{ auth: false }` on public endpoint requests |
| `Missing or invalid environment variables` at startup | A required `VITE_` var is missing or malformed | Fill `.env`, restart the dev server, see [Getting started](../overview/getting-started.md) |
| Auth loader never resolves | `getSession()` hung and the 5s safety timeout was removed or blocked | Restore the `setTimeout` in `initAuthSubscription`, check `authStore` wiring |
| SSE stuck on `disconnected` | `getToken()` returned null (no signed-in user) | Sign in, confirm the JWT is fresh |
| SSE stuck on `reconnecting` | Backend not sending heartbeats, or rejecting the query-string token | Confirm heartbeat interval, confirm `Referrer-Policy: no-referrer` |
| Dev API calls 404 | Proxy rewrite mismatch (`/api` to `/app/v1`) | Call relative paths, confirm the rewrite in `vite.config.ts` |
| `authenticated` E2E project redirects to `/login` | `.auth/user.json` stale or missing | Delete `.auth/user.json`, re-run `npm run test:e2e` |
| Unit test hangs on a `motion.*` element | Real framer-motion loaded instead of the mock | Run via `npx vitest`, do not import real framer-motion |
| `ApiClientError` with `type: "validation"` | Backend returned 400/422 with a `fields` map | Read `appError.fields`, surface per-field errors in the UI |
| `query-keys.test.ts` fails after a key rename | A mutation still invalidates the old key | Update every `invalidateQueries` call to match the new scope |

## Key source files

| File | Why it matters |
| --- | --- |
| `src/lib/api/client.ts` | The `HttpApiClient`, the 401 refresh flow, the `fetch.bind(window)` illegal-invocation fix, the `auth: false` opt-out. |
| `src/lib/api/errors.ts` | The `AppError` union, `ApiClientError`, `toAppError`, and `mapStatusToAppError`. |
| `src/lib/env.ts` | The Zod schema for `import.meta.env` and the validation error message. |
| `src/hooks/useAuth.ts` | The singleton `initAuthSubscription`, the 5s safety timeout, `getPlaywrightSession`, `_resetAuthForTests`. |
| `src/lib/sse/connection.ts` | The `SSEConnectionManager`, backoff schedule, heartbeat timeout, auth-failure retry cap. |
| `vite.config.ts` | The dev server proxy (`/api` to backend, rewrite to `/app/v1`, `changeOrigin`). |
| `playwright.config.ts` | The four projects and the `.auth/user.json` storage state wiring. |
| `e2e/auth-setup.ts` | The auth-setup project that writes `.auth/user.json`. |
