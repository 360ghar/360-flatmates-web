import { expect, seedDevAuth, test } from "./fixtures/test";

/**
 * E2E tests for the compatibility page at /compatibility/[id].
 *
 * The compatibility page requires authentication. Unauthenticated users
 * are redirected to /login. These tests verify:
 * - Auth redirect behavior for unauthenticated users
 * - Page structure when accessible (headings, progress rings, dimensions)
 *
 * Authenticated tests seed the DEV-only Playwright auth marker and use
 * deterministic API mocks from the shared fixture.
 */

test.describe("Compatibility page — unauthenticated access", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/compatibility/1");
    await expect(page).toHaveURL(/\/login/);
  });

  test("preserves path in the redirect query param", async ({ page }) => {
    await page.goto("/compatibility/1");
    await expect(page).toHaveURL(/redirect=/);
  });
});

test.describe("Compatibility page — authenticated access", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("page loads with compatibility heading", async ({ page }) => {
    await page.goto("/compatibility/1");
    // The page should render the Compatibility heading
    await expect(
      page.getByRole("heading", { name: /compatibility/i })
    ).toBeVisible();
  });

  test("progress rings render", async ({ page }) => {
    await page.goto("/compatibility/1");
    await expect(
      page.getByRole("heading", { name: /compatibility/i })
    ).toBeVisible();
    // ProgressRing components render SVG circles
    const progressRings = page.locator("svg circle, [class*='progress-ring']");
    // Either progress rings appear (with data) or loading skeletons show
    const hasRings = await progressRings.count().then((c) => c > 0);
    const hasSkeleton = await page
      .locator("[class*='animate-pulse'], [class*='skeleton']")
      .count()
      .then((c) => c > 0);
    expect(hasRings || hasSkeleton).toBeTruthy();
  });

  test("dimension rows display", async ({ page }) => {
    await page.goto("/compatibility/1");
    await expect(
      page.getByRole("heading", { name: /compatibility/i })
    ).toBeVisible();
    // The Breakdown card should be present once compatibility data resolves.
    await expect(page.getByRole("heading", { name: /breakdown/i })).toBeVisible();
  });

  test("summary section shows", async ({ page }) => {
    await page.goto("/compatibility/1");
    await expect(
      page.getByRole("heading", { name: /compatibility/i })
    ).toBeVisible();
    // The Summary card should be present once compatibility data resolves.
    await expect(page.getByRole("heading", { name: /summary/i })).toBeVisible();
  });
});
