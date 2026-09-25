import { expect, test } from "./fixtures/test";
import { installApiMocks } from "./fixtures/api";

test("failed server sign-out clears the SDK session in both tabs and after reload", async ({ page, context }) => {
  let revokeRequests = 0;
  await context.route("**/auth/v1/**", async (route) => {
    if (route.request().url().includes("/logout")) revokeRequests += 1;
    await route.fulfill({ status: 503, contentType: "application/json", body: '{"message":"unavailable"}' });
  });
  await page.goto("/login");
  const storageKey = await page.evaluate(async () => {
    const envPath = "/src/lib/env.ts";
    const { getEnv } = await import(envPath);
    const key = `sb-${new URL(getEnv().VITE_SUPABASE_URL).hostname.split(".")[0]}-auth-token`;
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const user = { id: "00000000-0000-0000-0000-000000000001", aud: "authenticated", role: "authenticated", email: "test@example.com", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
    const accessToken = [btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })), btoa(JSON.stringify({ sub: user.id, exp: expiresAt, role: "authenticated" })), "test-signature"].join(".");
    localStorage.setItem(key, JSON.stringify({ access_token: accessToken, refresh_token: "test-refresh-token", token_type: "bearer", expires_in: 3600, expires_at: expiresAt, user }));
    return key;
  });
  await page.goto("/profile");
  await expect(page.getByRole("button", { name: "Sign Out", exact: true })).toBeVisible();
  const other = await context.newPage();
  await installApiMocks(other);
  await other.goto("/home");
  await expect(other).toHaveURL(/\/home$/);
  await expect.poll(() => other.evaluate(async () => {
    const path = "/src/hooks/useAuth.ts";
    // Importing the existing module lets the normal app subscription settle.
    await import(path);
    const storePath = "/src/lib/stores/auth-store.ts";
    const { authStore } = await import(storePath);
    return authStore.getState().session?.user.id ?? null;
  })).not.toBeNull();

  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(other).toHaveURL(/\/login/);
  expect(revokeRequests).toBe(1);
  for (const tab of [page, other]) {
    expect(await tab.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
    await tab.reload();
    await expect(tab).toHaveURL(/\/login/);
    expect(await tab.evaluate(async () => {
      const path = "/src/lib/supabase/client.ts";
      const { getSupabaseBrowserClient } = await import(path);
      return (await getSupabaseBrowserClient().auth.getSession()).data.session;
    })).toBeNull();
  }
  await other.close();
});
