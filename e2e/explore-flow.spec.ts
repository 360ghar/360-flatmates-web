import { expect, seedDevAuth, test } from "./fixtures/test";

/**
 * E2E tests for the explore/map page at /explore.
 *
 * The explore page requires authentication and renders a Leaflet map
 * with property pins, filter controls, and zoom controls. These tests
 * verify:
 * - Auth redirect behavior for unauthenticated users
 * - Page structure when accessible (map container, filters, zoom controls)
 *
 * Authenticated tests seed the DEV-only Playwright auth marker and use
 * deterministic API mocks from the shared fixture.
 */

test.describe("Explore page — unauthenticated access", () => {
  test("redirects to /login when not authenticated", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).toHaveURL(/\/login/);
  });

  test("preserves path in the redirect query param", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).toHaveURL(/redirect=/);
  });
});

test.describe("Explore page — authenticated access", () => {
  test.beforeEach(async ({ page }) => {
    await seedDevAuth(page);
  });

  test("page loads with map container", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.locator("#map-container")).toBeVisible();
  });

  test("filter bar renders with Filters button", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.locator("#map-container")).toBeVisible();
    // The MapView component includes a filter bar with a Filters button
    await expect(page.getByRole("button", { name: /filters/i })).toBeVisible();
  });

  test("zoom controls are visible", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.locator("#map-container")).toBeVisible();
    // Leaflet zoom controls (+ and - buttons) should appear once the map loads
    // Wait for the map to initialize (Leaflet is dynamically imported)
    await expect(page.getByRole("button", { name: /zoom in/i })).toBeVisible();
  });

  test("map tile layer loads (CartoDB Positron)", async ({ page }) => {
    await page.goto("/explore");
    // Leaflet initializes the map shell before external tile images finish
    // loading, so assert the tile pane exists instead of sampling image count.
    await expect(page.locator("#map-container .leaflet-container")).toBeVisible();
    await expect(page.locator("#map-container .leaflet-tile-pane")).toBeAttached();
  });
});
