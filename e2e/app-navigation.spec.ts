import { delayApiResponse, expect, seedDevAuth, test } from "./fixtures/test";

/**
 * E2E tests for app navigation and page structure.
 *
 * Protected app routes require authentication.
 * Unauthenticated users are redirected to /login. These tests
 * verify:
 * - Auth redirect behavior for all protected routes
 * - Page structure when accessible (loading/empty states)
 * - Navigation between app pages (requires auth)
 *
 * Authenticated tests seed the DEV-only Playwright auth marker and use
 * deterministic API mocks from the shared fixture.
 */

test.describe("Protected routes — auth wall", () => {
  const protectedRoutes = [
    { path: "/home", name: "Home" },
    { path: "/swipe", name: "Swipe" },
    { path: "/chats", name: "Chats" },
    { path: "/likes", name: "Likes" },
    { path: "/matches", name: "Matches" },
    { path: "/visits", name: "Visits" },
    { path: "/profile", name: "Profile" },
    { path: "/settings", name: "Settings" },
    { path: "/notifications", name: "Notifications" },
    { path: "/post", name: "Post" },
    { path: "/manage", name: "Manage" },
    { path: "/dashboard", name: "Dashboard" },
    { path: "/explore", name: "Explore" },
    { path: "/onboarding", name: "Onboarding" },
    { path: "/saved-searches", name: "Saved Searches" },
    { path: "/alerts", name: "Alerts" },
    { path: "/admin", name: "Admin" },
  ];

  for (const route of protectedRoutes) {
    test(`unauthenticated access to ${route.name} (${route.path}) redirects to login`, async ({
      page,
    }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(/\/login/);
    });
  }

  test("redirect includes the original path in the redirect query param", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
    const urlObj = new URL(page.url());
    const redirectParam = urlObj.searchParams.get("redirect");
    expect(redirectParam).toBe("/settings");
  });
});

test.describe("App pages — authenticated page structure", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("Home page renders greeting and feed sections", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("heading", { name: /hi/i })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Nearby" })).toBeVisible();
  });

  test("Home page shows notification bell", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("link", { name: /notifications/i })).toBeVisible();
  });

  test("Home page renders filter chips", async ({ page }) => {
    await page.goto("/home");
    await expect(page.getByRole("checkbox", { name: "Nearby" })).toBeVisible();
    await expect(page.getByText("1BHK")).toBeVisible();
    await expect(page.getByText("Furnished")).toBeVisible();
    await expect(page.getByText("Budget+")).toBeVisible();
    await expect(page.getByText("Vegetarian")).toBeVisible();
  });

  test("Swipe page renders SwipeDeck", async ({ page }) => {
    await page.goto("/swipe");
    await expect(page.getByRole("region", { name: /profile cards/i })).toBeVisible();
  });

  test("Profile page renders Likes and Matches menu rows", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("link", { name: /likes & matches/i })).toBeVisible();
  });

  test("Chats page renders Chats heading", async ({ page }) => {
    await page.goto("/chats");
    await expect(page.getByRole("heading", { name: /chats/i })).toBeVisible();
  });

  test("Visits page renders My Visits heading", async ({ page }) => {
    await page.goto("/visits");
    await expect(page.getByRole("heading", { name: /my visits/i })).toBeVisible();
  });

  test("Settings entry point redirects to profile menu items", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/profile/);
    await expect(page.getByText("Notifications")).toBeVisible();
    await expect(page.getByText("Blocked Users")).toBeVisible();
    await expect(page.getByText("Report a Problem")).toBeVisible();
    await expect(page.getByText("Sign Out")).toBeVisible();
    await expect(page.getByText("Delete Account")).toBeVisible();
  });

  test("Settings — Notifications link navigates to /settings/notifications", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.getByText("Notifications").click();
    await expect(page).toHaveURL(/\/settings\/notifications/);
  });

  test("Settings — Blocked Users link navigates to /settings/blocked-users", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.getByText("Blocked Users").click();
    await expect(page).toHaveURL(/\/settings\/blocked-users/);
  });
});

test.describe("App navigation — sidebar and bottom nav", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("AppShell renders sidebar navigation on desktop", async ({ page, isMobile }) => {
    test.skip(isMobile, "Desktop sidebar is hidden on mobile.");
    await page.goto("/home");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav).toBeVisible();
  });

  test("Desktop sidebar links navigate to correct pages", async ({ page }) => {
    await page.goto("/home");
    const swipeLink = page.getByRole("link", { name: /swipe/i }).first();
    await swipeLink.click();
    await expect(page).toHaveURL(/\/swipe/);
  });

  test("Mobile bottom nav is visible on mobile viewport", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Only applies to mobile viewport");
    await page.goto("/home");
    const bottomNav = page.getByRole("navigation", { name: "Mobile primary" });
    await expect(bottomNav).toBeVisible();
  });
});

test.describe("App page — loading and error states", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("Home page shows loading skeletons before data loads", async ({ page }) => {
    await delayApiResponse(page, "/flatmates/bootstrap");
    await page.goto("/home");
    const skeletons = page.locator(
      ".shimmer:visible, [class*='animate-shimmer']:visible, [class*='animate-pulse']:visible, [class*='skeleton']:visible"
    );
    await expect(skeletons.first()).toBeVisible({ timeout: 5_000 });
  });

  test("Swipe page shows loading skeleton before profiles load", async ({ page }) => {
    await delayApiResponse(page, "/flatmates/profiles");
    await page.goto("/swipe");
    const skeletons = page.locator(
      ".shimmer:visible, [class*='animate-shimmer']:visible, [class*='animate-pulse']:visible, [class*='skeleton']:visible"
    );
    await expect(skeletons.first()).toBeVisible({ timeout: 5_000 });
  });

  test("Chats page shows loading skeletons before conversations load", async ({ page }) => {
    await delayApiResponse(page, "/flatmates/conversations");
    await page.goto("/chats");
    const skeletons = page.locator(
      ".shimmer:visible, [class*='animate-shimmer']:visible, [class*='animate-pulse']:visible, [class*='skeleton']:visible"
    );
    await expect(skeletons.first()).toBeVisible({ timeout: 5_000 });
  });

  test("Visits page shows loading skeletons before visits load", async ({ page }) => {
    await delayApiResponse(page, "/visits");
    await page.goto("/visits");
    const skeletons = page.locator(
      ".shimmer:visible, [class*='animate-shimmer']:visible, [class*='animate-pulse']:visible, [class*='skeleton']:visible"
    );
    await expect(skeletons.first()).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("Onboarding — redirect behavior", () => {
  test("unauthenticated access to /onboarding redirects to login", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to /onboarding/[step] redirects to login", async ({ page }) => {
    await page.goto("/onboarding/mode");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Admin pages — auth wall", () => {
  test("unauthenticated access to /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to /admin/moderation/listings redirects to login", async ({
    page,
  }) => {
    await page.goto("/admin/moderation/listings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to /admin/moderation/reports redirects to login", async ({
    page,
  }) => {
    await page.goto("/admin/moderation/reports");
    await expect(page).toHaveURL(/\/login/);
  });
});
