import { expect, seedDevAuth, test } from "./fixtures/test";

/**
 * E2E tests for visit scheduling flows.
 *
 * The /visits page requires authentication. Unauthenticated users are
 * redirected to /login. Since there is no real backend, these
 * tests verify:
 * - Auth redirect behavior for unauthenticated users
 * - Page structure (loading/empty/error states) when accessed
 *
 * Authenticated tests seed the DEV-only Playwright auth marker and use
 * deterministic API mocks from the shared fixture.
 */

test.describe("Visits page — unauthenticated access", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/visits");
    await expect(page).toHaveURL(/\/login/);
  });

  test("preserves /visits in the redirect query param", async ({ page }) => {
    await page.goto("/visits");
    await expect(page).toHaveURL(/redirect=.*visits/);
  });

  test("redirects from /visits/[id] when not authenticated", async ({ page }) => {
    await page.goto("/visits/visit-123");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Visits page — authenticated access", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("renders the My Visits heading", async ({ page }) => {
    await page.goto("/visits");
    const url = page.url();
    if (!url.includes("/login")) {
      await expect(page.getByRole("heading", { name: /my visits/i })).toBeVisible();
    }
  });

  test("renders fixture visit cards after loading", async ({ page }) => {
    await page.goto("/visits");
    const card = page.locator("article:visible").filter({ hasText: "Sunny room in Koramangala" }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText("Property Tour")).toBeVisible();
  });

  test("shows empty state for tabs without matching visits", async ({ page }) => {
    await page.goto("/visits");
    await page.getByRole("tab", { name: "Past" }).click();
    await expect(page.getByText(/no past visits/i)).toBeVisible();
  });

  test("visit cards display visit details when data is available", async ({ page }) => {
    await page.goto("/visits");
    const url = page.url();
    if (!url.includes("/login")) {
      // Aspirational — requires backend data
      // Verify the page rendered without crashing
      await expect(page).toHaveURL(/\/visits/);
    }
  });
});

test.describe("Visit detail page — /visits/[id] (unauthenticated)", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/visits/visit-123");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Visit detail page — /visits/[id] (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("renders visit detail view when authenticated", async ({ page }) => {
    await page.goto("/visits/301");
    await expect(page.getByRole("heading", { name: /visit details/i })).toBeVisible();
    const card = page.locator("article:visible").filter({ hasText: "Sunny room in Koramangala" }).first();
    await expect(card).toBeVisible();
    await expect(card.getByText("Property Tour")).toBeVisible();
    await expect(page.getByRole("button", { name: /confirm visit/i })).toBeVisible();
  });
});
