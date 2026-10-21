import { navigatorLock, processLock, type SupabaseClient } from "@supabase/supabase-js";
import { authSessionLifecycle } from "@/lib/auth/session-lifecycle";

type StorageBackend = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): StorageBackend | null {
  try {
    const storage = window.localStorage;
    const probe = "flatmates-auth-storage-test";
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

/** Own both persistent and fallback storage so logout can clear either one. */
export class AuthSessionStorage {
  private readonly memory = new Map<string, string>();
  readonly lock = typeof navigator !== "undefined" && navigator.locks
    ? navigatorLock
    : processLock;

  constructor(
    readonly key: string,
    private readonly persistent: StorageBackend | null = browserStorage()
  ) {}

  getItem(key: string): string | null {
    return this.persistent ? this.persistent.getItem(key) : this.memory.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.persistent) this.persistent.setItem(key, value);
    else this.memory.set(key, value);
  }

  removeItem(key: string): void {
    this.persistent?.removeItem(key);
    this.memory.delete(key);
  }

  async clearSession(): Promise<void> {
    // Use the same public lock supplied to Supabase. An already running
    // refresh (including in another tab) must finish before credentials go.
    await this.lock(`lock:${this.key}`, -1, async () => {
      for (const key of [this.key, `${this.key}-code-verifier`, `${this.key}-user`]) {
        this.removeItem(key);
      }
    });
  }
}

export async function signOutWithLocalCleanup(
  auth: Pick<SupabaseClient["auth"], "signOut" | "stopAutoRefresh" | "startAutoRefresh">,
  storage: AuthSessionStorage
): Promise<unknown> {
  authSessionLifecycle.beginSignOut();
  let revokeError: unknown = null;
  try {
    await auth.stopAutoRefresh();
    try {
      const result = await auth.signOut();
      revokeError = result.error;
    } catch (error) {
      revokeError = error;
    }
    await storage.clearSession();
    if (revokeError) {
      // scope:local also revokes remotely when it has a token. Clear storage
      // first, then use the public API to emit SIGNED_OUT across tabs.
      const { error } = await auth.signOut({ scope: "local" });
      if (error) throw error;
    }
    return revokeError;
  } finally {
    authSessionLifecycle.finishSignOut();
    // No session means no refresh. Restore normal behavior for the next login.
    await auth.startAutoRefresh();
  }
}
