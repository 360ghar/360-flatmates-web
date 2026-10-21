import { AuthClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthSessionStorage, signOutWithLocalCleanup } from "../session-storage";

const clients: AuthClient[] = [];
let nextKey = 0;
const session = {
  access_token: "test-access-token",
  refresh_token: "test-refresh-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "account-a" }
};

function client(storage: AuthSessionStorage, fetch: typeof globalThis.fetch) {
  const auth = new AuthClient({
    url: "https://test.supabase.co/auth/v1",
    storageKey: storage.key,
    storage,
    lock: storage.lock,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    fetch
  });
  clients.push(auth);
  return auth;
}

function seededStorage(persistent = true) {
  const key = `sb-logout-test-${++nextKey}-auth-token`;
  const storage = new AuthSessionStorage(key, persistent ? localStorage : null);
  storage.setItem(key, JSON.stringify(session));
  storage.setItem(`${key}-code-verifier`, "pkce-secret");
  storage.setItem(`${key}-user`, "user-secret");
  return storage;
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((auth) => auth.stopAutoRefresh()));
  localStorage.clear();
});

describe("logout with the installed Supabase SDK", () => {
  it.each(["503", "network"])("clears credentials after %s and stays out after reload", async (failure) => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () => {
      if (failure === "network") throw new TypeError("Failed to fetch");
      return new Response('{"message":"unavailable"}', { status: 503 });
    });
    const storage = seededStorage();
    const auth = client(storage, fetch);
    await auth.getSession();
    const events: string[] = [];
    auth.onAuthStateChange((event) => { events.push(event); });

    expect(await signOutWithLocalCleanup(auth, storage)).toBeTruthy();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(events).toContain("SIGNED_OUT");
    expect((await auth.getSession()).data.session).toBeNull();
    for (const suffix of ["", "-user", "-code-verifier"]) {
      expect(storage.getItem(`${storage.key}${suffix}`)).toBeNull();
    }
    const restarted = client(new AuthSessionStorage(storage.key, localStorage), fetch);
    expect((await restarted.getSession()).data.session).toBeNull();
  });

  it("clears the memory fallback and accepts a subsequent login", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response("{}", { status: 503 }));
    const storage = seededStorage(false);
    const auth = client(storage, fetch);
    await signOutWithLocalCleanup(auth, storage);
    expect((await auth.getSession()).data.session).toBeNull();

    fetch.mockImplementation(async () => new Response(JSON.stringify(session), { status: 200 }));
    const login = await auth.signInWithPassword({ email: "test@example.com", password: "test-password" });
    expect(login.error).toBeNull();
    expect((await auth.getSession()).data.session?.user.id).toBe("account-a");
  });

  it("waits for another client's refresh before clearing the shared session", async () => {
    let finishRefresh!: (response: Response) => void;
    const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (url) => {
      if (String(url).includes("/token")) {
        return new Promise<Response>((resolve) => { finishRefresh = resolve; });
      }
      return new Response("{}", { status: 503 });
    });
    const storage = seededStorage();
    const first = client(storage, fetch);
    const other = client(new AuthSessionStorage(storage.key, localStorage), fetch);
    await Promise.all([first.getSession(), other.getSession()]);
    const refresh = other.refreshSession();
    await vi.waitFor(() => expect(finishRefresh).toBeDefined());
    const logout = signOutWithLocalCleanup(first, storage);
    finishRefresh(new Response(JSON.stringify({ ...session, access_token: "refreshed-token" }), { status: 200 }));
    await Promise.all([refresh, logout]);
    expect((await first.getSession()).data.session).toBeNull();
    expect((await other.getSession()).data.session).toBeNull();
    expect(storage.getItem(storage.key)).toBeNull();
  });
});
