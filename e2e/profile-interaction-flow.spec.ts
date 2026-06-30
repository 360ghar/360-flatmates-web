import { expect, test } from "./fixtures/test";

/**
 * E2E tests for profile interaction flows.
 *
 * Profile and settings sub-pages require authentication. Unauthenticated
 * users are redirected to /login. These tests verify:
 * - Auth redirect behavior for profile and settings pages
 */

test.describe("Profile interaction — unauthenticated access", () => {
  test("redirects to /login when visiting /profile/1 without auth", async ({
    page,
  }) => {
    await page.goto("/profile/1");
    await expect(page).toHaveURL(/\/login/);
  });

  test("preserves /profile/1 in the redirect query param", async ({
    page,
  }) => {
    await page.goto("/profile/1");
    await expect(page).toHaveURL(/redirect=/);
  });
});

test.describe("Settings sub-pages — unauthenticated access", () => {
  test("redirects to /login when visiting /settings/report-problem without auth", async ({
    page,
  }) => {
    await page.goto("/settings/report-problem");
    await expect(page).toHaveURL(/\/login/);
  });

  test("preserves path in the redirect query param for report-problem", async ({
    page,
  }) => {
    await page.goto("/settings/report-problem");
    await expect(page).toHaveURL(/redirect=/);
  });
});
