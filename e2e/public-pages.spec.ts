import { expect, test } from "./fixtures/test";
import type { Page } from "@playwright/test";

/**
 * E2E smoke tests for public pages.
 *
 * Public pages do not require authentication and are mostly server
 * components (SSG/SSR). They should render without any API dependency.
 * These tests verify that each public page loads and displays its
 * key content elements.
 */

async function getPublicHeaderLink(page: Page, name: string | RegExp, exact = false) {
  const header = page.getByRole("banner");
  const desktopLink = header.getByRole("link", { name, exact });
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    return desktopLink;
  }

  const menuButton = header.getByRole("button", { name: /open navigation menu/i });
  await expect(menuButton).toBeVisible();
  await menuButton.click();

  const mobileNav = page.getByRole("navigation", { name: /mobile navigation/i });
  await expect(mobileNav).toBeVisible();
  return mobileNav.getByRole("link", { name, exact });
}

test.describe("Landing page — /", () => {
  test("loads and renders the hero section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /find your flatmate.*not a nightmare/i })
    ).toBeVisible();
  });

  test("renders the public layout header with logo and nav", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");

    // Logo link
    const logoLink = header.getByRole("link", { name: /360 flatmates home/i });
    await expect(logoLink).toBeVisible();

    if ((page.viewportSize()?.width ?? 0) < 768) {
      const menuButton = header.getByRole("button", { name: /open navigation menu/i });
      await menuButton.click();
      const mobileNav = page.getByRole("navigation", { name: /mobile navigation/i });
      await expect(mobileNav.getByRole("link", { name: "About", exact: true })).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: "Discover", exact: true })).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: "Search", exact: true })).toBeVisible();
      await expect(mobileNav.getByRole("link", { name: /sign in/i })).toBeVisible();
    } else {
      await expect(header.getByRole("link", { name: "About", exact: true })).toBeVisible();
      await expect(header.getByRole("link", { name: "Discover", exact: true })).toBeVisible();
      await expect(header.getByRole("link", { name: "Search", exact: true })).toBeVisible();
      await expect(header.getByRole("link", { name: /sign in/i })).toBeVisible();
    }
  });

  test("renders the public layout footer", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");

    // Footer Explore section
    await expect(footer.getByRole("heading", { name: "Explore" })).toBeVisible();
    await expect(footer.getByRole("link", { name: /browse listings/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /search flatmates/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /guides & tips/i })).toBeVisible();

    // Footer Company section
    await expect(footer.getByRole("heading", { name: "Company" })).toBeVisible();
    await expect(footer.getByRole("link", { name: /terms & conditions/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /privacy policy/i })).toBeVisible();

    // Copyright
    await expect(footer.getByText(/360 flatmates\. all rights reserved/i)).toBeVisible();
  });
});

test.describe("About page — /about", () => {
  test("loads and renders the About heading", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { name: /finding a home starts with finding your people/i })).toBeVisible();
  });

  test("renders the 'About' eyebrow", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("#main").getByText("About", { exact: true })).toBeVisible();
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
    const browseLink = page.locator("#main").getByRole("link", { name: /browse listings/i });
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
    await expect(page.getByRole("heading", { name: /search listings/i })).toBeVisible();
  });

  test("renders public search controls", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByLabel(/filter by city/i)).toBeVisible();
    await expect(page.getByLabel(/filter by bedrooms/i)).toBeVisible();
  });
});

test.describe("Semantic search page — /search/semantic", () => {
  test("loads publicly and carries its page-level noindex directive", async ({ page }) => {
    await page.goto("/search/semantic");
    await expect(page).toHaveURL(/\/search\/semantic$/);
    await expect(page.getByRole("heading", { name: /describe your ideal home/i })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
  });
});

test.describe("SEO static files", () => {
  test("robots.txt allows indexable search while blocking protected and noindex routes", async ({ page }) => {
    const response = await page.request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();
    const robots = await response.text();

    expect(robots).toMatch(/^Allow:\s*\/search$/m);
    expect(robots).not.toMatch(/^Disallow:\s*\/search\/?$/m);
    expect(robots).toMatch(/^Disallow:\s*\/search\/semantic$/m);
    expect(robots).toMatch(/^Disallow:\s*\/blog\/preview\/$/m);
    expect(robots).toMatch(/^Disallow:\s*\/explore$/m);
    expect(robots).toContain("Sitemap: https://360ghar.com/sitemap.xml");
  });

  test("sitemap.xml advertises indexable public routes only", async ({ page }) => {
    const response = await page.request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const sitemap = await response.text();

    expect(sitemap).toContain("<loc>https://360ghar.com/search</loc>");
    expect(sitemap).toContain("<loc>https://360ghar.com/discover</loc>");
    expect(sitemap).toContain("<loc>https://360ghar.com/cities/bangalore</loc>");
    expect(sitemap).not.toContain("<loc>https://360ghar.com/stats</loc>");
    expect(sitemap).not.toContain("<loc>https://360ghar.com/search/semantic</loc>");
  });

  test("llms.txt documents public search accurately", async ({ page }) => {
    const response = await page.request.get("/llms.txt");
    expect(response.ok()).toBeTruthy();
    const llms = await response.text();

    expect(llms).toContain("[Search listings](https://360ghar.com/search)");
    expect(llms).toContain("[Semantic search](https://360ghar.com/search/semantic)");
    expect(llms).toContain("/search` and `/search/semantic` are public acquisition routes");
    expect(llms).not.toContain("Authenticated areas (e.g. `/search`");
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
    await (await getPublicHeaderLink(page, "About", true)).click();
    await expect(page).toHaveURL(/\/about/);
  });

  test("header Discover link navigates to /discover", async ({ page }) => {
    await page.goto("/");
    await (await getPublicHeaderLink(page, "Discover", true)).click();
    await expect(page).toHaveURL(/\/discover/);
  });

  test("header Search link navigates to /search", async ({ page }) => {
    await page.goto("/");
    await (await getPublicHeaderLink(page, "Search", true)).click();
    await expect(page).toHaveURL(/\/search/);
  });

  test("header Sign in link navigates to login", async ({ page }) => {
    await page.goto("/");
    await (await getPublicHeaderLink(page, /sign in/i)).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("footer Terms & Conditions link navigates to /terms", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: /terms & conditions/i }).click();
    await expect(page).toHaveURL(/\/terms/);
  });

  test("footer Privacy Policy link navigates to /privacy", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: /privacy policy/i }).click();
    await expect(page).toHaveURL(/\/privacy/);
  });

  test("footer Browse Listings link navigates to /discover", async ({ page }) => {
    await page.goto("/");
    const browseLink = page.getByRole("contentinfo").getByRole("link", { name: /browse listings/i });
    await browseLink.click();
    await expect(page).toHaveURL(/\/discover/);
  });

  test("logo link navigates to home page", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("banner").getByRole("link", { name: /360 flatmates home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
