# OAuth Redirect Setup

## Problem
Google/Apple OAuth sign-in on `flatmates.360ghar.com` redirects to `360ghar.com`
instead of back to the flatmates app (issue #14).

## Root Cause
The client code correctly requests a redirect to
`https://flatmates.360ghar.com/auth/callback` (built from `window.location.origin`
in `src/lib/auth/oauth-redirect.ts`). However, Supabase only honors redirect URLs
that are in the project's **Redirect URLs allowlist**. If the flatmates callback URL
is missing from the allowlist, Supabase falls back to the configured **Site URL**
(`https://360ghar.com`), causing the wrong-domain redirect.

## Fix (Supabase Dashboard — no code change required)

1. Go to your Supabase project dashboard.
2. Navigate to **Authentication → URL Configuration**.
3. Set **Site URL** to `https://flatmates.360ghar.com`.
4. Under **Redirect URLs**, add ALL deployment callback URLs:
   - `https://flatmates.360ghar.com/auth/callback`
   - `https://360ghar.com/auth/callback` (if the main site also uses OAuth)
   - `http://localhost:5173/auth/callback` (for local development)
5. Click **Save**.
6. For Google OAuth specifically, also verify in **Authentication → Providers → Google**
   that the authorized redirect URIs in the Google Cloud Console include the Supabase
   callback (`https://<project>.supabase.co/auth/v1/callback`).

## Verification
1. Clear browser storage for `flatmates.360ghar.com`.
2. Navigate to `https://flatmates.360ghar.com/login`.
3. Click "Continue with Google".
4. After authentication, you should land on
   `https://flatmates.360ghar.com/auth/callback` and then be routed to `/home`
   (or `/add-phone` for new OAuth users without a phone number).

## Code Reference
- `src/lib/auth/oauth-redirect.ts` — builds the redirect URL from `window.location.origin`.
- `src/pages/auth/AuthCallbackPage.tsx` — exchanges the OAuth code and routes the user.
- `src/hooks/useAuth.ts` — `signInWithGoogle` / `signInWithApple` pass the redirect URL to Supabase.
