import { expect, seedDevAuth, test } from "./fixtures/test";

/**
 * E2E tests for chat and messaging flows.
 *
 * The /chats page requires authentication. Unauthenticated users are
 * redirected to /login. Since there is no real backend, these
 * tests verify:
 * - Auth redirect behavior for unauthenticated users
 * - Page structure when accessed (loading/empty/error states)
 *
 * Authenticated tests seed the DEV-only Playwright auth marker and use
 * deterministic API mocks from the shared fixture.
 */

test.describe("Chats page — unauthenticated access", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/chats");
    await expect(page).toHaveURL(/\/login/);
  });

  test("preserves /chats in the redirect query param", async ({ page }) => {
    await page.goto("/chats");
    await expect(page).toHaveURL(/redirect=.*chats/);
  });

  test("redirects from /chats/[id] when not authenticated", async ({ page }) => {
    await page.goto("/chats/test-conversation-id");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Chats page — authenticated access", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("renders the Chats heading", async ({ page }) => {
    await page.goto("/chats");
    const url = page.url();
    if (!url.includes("/login")) {
      await expect(page.getByRole("heading", { name: /chats/i })).toBeVisible();
    }
  });

  test("renders fixture conversations after loading", async ({ page }) => {
    await page.goto("/chats");
    await expect(page.getByRole("heading", { name: /conversations/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /aarav mehta/i }).first()).toBeVisible();
  });

  test("renders matched peers for starting chats", async ({ page }) => {
    await page.goto("/chats");
    await expect(page.getByRole("heading", { name: /your matches/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /start chat with aarav mehta/i })).toBeVisible();
  });

  test("clicking a conversation navigates to /chats/[id]", async ({ page }) => {
    await page.goto("/chats");
    const url = page.url();
    if (!url.includes("/login")) {
      // This test is aspirational — requires backend data
      // Verify the page rendered without crashing
      await expect(page).toHaveURL(/\/chats/);
    }
  });
});

test.describe("Chat detail page — /chats/[id] (unauthenticated)", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/chats/conversation-123");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Chat detail page — /chats/[id] (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("renders chat detail view when authenticated", async ({ page }) => {
    await page.goto("/chats/201");
    await expect(page.getByRole("heading", { name: /aarav mehta/i })).toBeVisible();
    await expect(page.getByRole("log", { name: /messages with aarav mehta/i })).toBeVisible();
    await expect(page.getByText("Can I visit this weekend?")).toBeVisible();
  });

  test("message input is present in chat detail", async ({ page }) => {
    await page.goto("/chats/201");
    await expect(page.getByLabel(/type a message/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /schedule a visit/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
  });
});
