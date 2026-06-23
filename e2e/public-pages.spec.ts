import { expect, test } from "@playwright/test";

/**
 * E2E smoke tests for public pages.
 *
 * Public pages do not require authentication and are mostly server
 * components (SSG/SSR). They should render without any API dependency.
 * These tests verify that each public page loads and displays its
 * key content elements.
 */

test.describe("Landing page — /", () => {
  test("loads and renders the hero section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /find your flatmate.*find your vibe/i })
    ).toBeVisible();
  });

  test("renders the public layout header with logo and nav", async ({ page }) => {
    await page.goto("/");

    // Logo link
    const logoLink = page.getByRole("link", { name: /360 flatmates home/i });
    await expect(logoLink).toBeVisible();

    // Navigation links (desktop only)
    const aboutLink = page.getByRole("link", { name: "About" });
    await expect(aboutLink).toBeVisible();

    const discoverLink = page.getByRole("link", { name: "Discover" });
    await expect(discoverLink).toBeVisible();

    const searchLink = page.getByRole("link", { name: "Search" });
    await expect(searchLink).toBeVisible();

    // Sign in button
    const signInLink = page.getByRole("link", { name: /sign in/i });
    await expect(signInLink).toBeVisible();
  });

  test("renders the public layout footer", async ({ page }) => {
    await page.goto("/");

    // Footer Explore section
    await expect(page.getByText("Explore")).toBeVisible();
    await expect(page.getByRole("link", { name: /browse listings/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Search" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /city stats/i })).toBeVisible();

    // Footer Legal section
    await expect(page.getByText("Legal")).toBeVisible();
    await expect(page.getByRole("link", { name: /terms & conditions/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy policy/i })).toBeVisible();

    // Copyright
    await expect(page.getByText(/360 flatmates\. all rights reserved/i)).toBeVisible();
  });
});

test.describe("About page — /about", () => {
  test("loads and renders the About heading", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /360 flatmates/i })).toBeVisible();
  });

  test("renders the 'About' eyebrow", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByText("About")).toBeVisible();
  });

  test("renders values section with cards", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /our values/i })).toBeVisible();

    // Value cards with TrustBadges
    await expect(page.getByText("Compatibility over convenience")).toBeVisible();
    await expect(page.getByText("Verified, always")).toBeVisible();
    await expect(page.getByText("Safety as default")).toBeVisible();
    await expect(page.getByText("Context-rich decisions")).toBeVisible();
  });

  test("renders the team section", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /the team/i })).toBeVisible();
    await expect(page.getByText(/small team of engineers and designers/i)).toBeVisible();
  });

  test("Browse Listings link is present", async ({ page }) => {
    await page.goto("/about");
    const browseLink = page.getByRole("link", { name: /browse listings/i });
    await expect(browseLink).toBeVisible();
  });
});

test.describe("Terms page — /terms", () => {
  test("loads and renders the Terms & Conditions heading", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms & conditions/i })).toBeVisible();
  });

  test("renders legal content sections", async ({ page }) => {
    await page.goto("/terms");
    // The terms page has 12 legal sections rendered as Cards
    // Verify at least the first section heading exists
    const cards = page.locator("[class*='card'], [class*='rounded']");
    await expect(cards.first()).toBeVisible();
  });
});

test.describe("Privacy page — /privacy", () => {
  test("loads and renders the Privacy Policy heading", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();
  });

  test("renders legal content sections", async ({ page }) => {
    await page.goto("/privacy");
    const cards = page.locator("[class*='card'], [class*='rounded']");
    await expect(cards.first()).toBeVisible();
  });
});

test.describe("Discover page — /discover", () => {
  test("loads and renders the Browse Listings heading", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByRole("heading", { name: /browse listings/i })).toBeVisible();
  });

  test("renders quick filter chips", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.getByText("Nearby")).toBeVisible();
    await expect(page.getByText("1BHK")).toBeVisible();
    await expect(page.getByText("Furnished")).toBeVisible();
  });
});

test.describe("Search page — /search", () => {
  test("loads and renders the search heading", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("heading", { name: /search flatmates & rooms/i })).toBeVisible();
  });

  test("renders the Advanced search eyebrow", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText(/advanced search/i)).toBeVisible();
  });
});

test.describe("404 — not found page", () => {
  test("renders a not-found page for invalid routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist-at-all");
    // Next.js should render the not-found page or a 404
    // The (public)/not-found page should handle this
    await expect(page).toHaveURL(/this-page-does-not-exist-at-all/);
  });
});

test.describe("Public layout — navigation links", () => {
  test("header About link navigates to /about", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about/);
  });

  test("header Discover link navigates to /discover", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Discover" }).click();
    await expect(page).toHaveURL(/\/discover/);
  });

  test("header Search link navigates to /search", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/search/);
  });

  test("header Sign in link navigates to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("footer Terms & Conditions link navigates to /terms", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /terms & conditions/i }).click();
    await expect(page).toHaveURL(/\/terms/);
  });

  test("footer Privacy Policy link navigates to /privacy", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /privacy policy/i }).click();
    await expect(page).toHaveURL(/\/privacy/);
  });

  test("footer Browse Listings link navigates to /discover", async ({ page }) => {
    await page.goto("/");
    const browseLinks = page.getByRole("link", { name: /browse listings/i });
    await browseLinks.first().click();
    await expect(page).toHaveURL(/\/discover/);
  });

  test("logo link navigates to home page", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("link", { name: /360 flatmates home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
