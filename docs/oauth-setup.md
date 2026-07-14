# OAuth Redirect Setup

## Problem
Google/Apple OAuth sign-in on `flatmates.360ghar.com` redirects to `360ghar.com`
instead of back to the flatmates app (issue #14).

## Root Cause
Two layers:

1. **Client** must pass `redirectTo` as the **current origin** callback only:
   `https://flatmates.360ghar.com/auth/callback`  
   built from `window.location.origin` in `src/lib/auth/oauth-redirect.ts`.
   Do **not** put `?next=…` on this URL — Supabase allowlist matching often
   rejects query strings and **silently** falls back to Site URL.

2. **Supabase dashboard** must allowlist each deployment. Missing/mismatched
   entries → same silent fallback to Site URL (`https://360ghar.com`).

Post-login destinations (`/home`, `/swipe`, …) are stored in `sessionStorage`
(`oauth:next`) by `stashOAuthNext` before OAuth starts, and read by
`AuthCallbackPage` via `consumeOAuthNext`.

## Fix (code — already in repo)
- `buildOAuthRedirectUrl()` → clean `/auth/callback` only
- `stashOAuthNext` / `consumeOAuthNext` for return path
- Production ignores `VITE_AUTH_REDIRECT_URL` (dev-only override)

## Fix (Supabase Dashboard — human, required)

1. Open Supabase project **`zthcndwkvhstjgusovqw`** (the one in all app `.env` files).
2. **Authentication → URL Configuration**.
3. **Site URL**: keep `https://360ghar.com` (primary marketplace).  
   Do **not** set Site URL to flatmates — that would reverse the bug for the main site.
4. **Redirect URLs** — prefer wildcards so path/query variants never fall back:

   ```
   https://360ghar.com/**
   https://flatmates.360ghar.com/**
   https://tours.360ghar.com/**
   https://admin.360ghar.com/**
   http://localhost:3000/**
   http://localhost:5173/**
   ```

5. For Google OAuth, ensure Google Cloud Console authorized redirect URIs include
   only the Supabase callback:  
   `https://zthcndwkvhstjgusovqw.supabase.co/auth/v1/callback`

## Verification
1. Clear browser storage for `flatmates.360ghar.com`.
2. Navigate to `https://flatmates.360ghar.com/login`.
3. Click "Continue with Google"; in Network, authorize URL `redirect_to` should be
   `https://flatmates.360ghar.com/auth/callback` **without** `?next=`.
4. After authentication, land on
   `https://flatmates.360ghar.com/auth/callback?code=…` then `/home`
   (or `/add-phone` for new OAuth users without a phone number).

## Code Reference
- `src/lib/auth/oauth-redirect.ts` — clean redirect URL + next stash
- `src/pages/auth/AuthCallbackPage.tsx` — exchanges code, consumes next
- `src/hooks/useAuth.ts` — `signInWithGoogle` / `signInWithApple`
