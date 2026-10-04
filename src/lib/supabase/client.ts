import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";
import { AuthSessionStorage, signOutWithLocalCleanup } from "./session-storage";

/**
 * Singleton browser Supabase client.
 *
 * Uses `createClient` from `@supabase/supabase-js` which manages auth
 * automatically in the browser. The singleton pattern ensures one
 * client instance across the app.
 */
let browserClient: ReturnType<typeof createClient> | undefined;
let sessionStorage: AuthSessionStorage;
let signOutPromise: Promise<unknown> | undefined;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getEnv();
  sessionStorage = new AuthSessionStorage(
    `sb-${new URL(env.VITE_SUPABASE_URL).hostname.split(".")[0]}-auth-token`
  );
  browserClient = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storageKey: sessionStorage.key,
        storage: sessionStorage,
        lock: sessionStorage.lock,
        // PKCE flow: OAuth providers (Google/Apple) redirect back with a
        // `?code=` param that AuthCallbackPage exchanges via
        // `exchangeCodeForSession`. The supabase-js default is `implicit`,
        // which instead returns tokens in the URL hash and would make the
        // callback's `searchParams.get("code")` always null — silently
        // breaking Google sign-in.
        flowType: "pkce",
        // The callback page exchanges the code explicitly, so disable the
        // automatic URL detection to avoid a double-exchange race that
        // consumes the single-use code before our handler runs.
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  return browserClient;
}

export function signOutBrowserSession(): Promise<unknown> {
  const client = getSupabaseBrowserClient();
  signOutPromise ??= signOutWithLocalCleanup(client.auth, sessionStorage)
    .finally(() => { signOutPromise = undefined; });
  return signOutPromise;
}
