import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

/**
 * Singleton browser Supabase client.
 *
 * Uses `createClient` from `@supabase/supabase-js` which manages auth
 * automatically in the browser. The singleton pattern ensures one
 * client instance across the app.
 */
let browserClient: ReturnType<typeof createClient> | undefined;

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getEnv();
  browserClient = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY
  );

  return browserClient;
}
