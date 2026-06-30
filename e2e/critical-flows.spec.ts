import { expect, seedDevAuth, test } from "./fixtures/test";

test("public discovery sends unauthenticated listing contact to login", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: /find your flatmate.*not a nightmare/i })).toBeVisible();
  await page.locator("#main").getByRole("link", { name: /start matching/i }).first().click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole("heading", { name: "Browse Listings" })).toBeVisible();

  await page.getByRole("button", { name: "View Details" }).first().click();
  await expect(page).toHaveURL(/\/login\?redirect=.*%2Fdiscover%2F/);
  await expect(page.getByRole("heading", { name: /sign in or sign up/i })).toBeVisible();
});

test("search filters open the saved searches workflow", async ({ page }) => {
  await seedDevAuth(page);
  await page.goto("/search");

  await expect(page.getByRole("heading", { name: "Search Listings" })).toBeVisible();
  await page.getByLabel(/filter by city/i).selectOption("2");
  await page.getByRole("button", { name: "Save search" }).click();
  await expect(page).toHaveURL(/\/saved-searches$/);
  await expect(page.locator("#main").getByRole("heading", { name: "Saved Searches", exact: true })).toBeVisible();
});

test("password setup recovery survives reload and can be cancelled", async ({ page }) => {
  await page.goto("/login?flow=set-password&identifier=9876543210&redirect=%2Fhome");

  await expect(page.getByLabel("Create password")).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Create password")).toBeVisible();

  await page.getByRole("button", { name: "Use a different identifier" }).click();
  await expect(page.getByLabel("Email or phone")).toBeVisible();
  await expect(page).not.toHaveURL(/flow=set-password/);
});

test("swipe interactions open match and profile detail states", async ({ page }) => {
  await seedDevAuth(page);
  await page.goto("/swipe");

  const deck = page.getByRole("region", { name: /Profile cards/i });
  await expect(deck).toBeVisible();
  const gotIt = page.getByRole("button", { name: "Got it" });
  if (await gotIt.isVisible()) {
    await gotIt.click();
  }
  const details = deck.getByRole("region", { name: "Profile details" });
  if (!(await details.isVisible().catch(() => false))) {
    await deck.getByRole("button", { name: /view .* profile details/i }).first().click();
  }
  await expect(details).toBeVisible();
  await deck.getByRole("button", { name: "Like", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Match celebration" })).toBeVisible();
});

test("chat supports visit scheduling and live draft send", async ({ page }) => {
  await seedDevAuth(page);
  await page.goto("/chats/201");

  await expect(page.getByRole("heading", { name: /aarav mehta/i })).toBeVisible();
  await page.getByRole("button", { name: "Schedule a visit" }).click();
  await expect(page.getByRole("dialog", { name: "Schedule a Visit" })).toBeVisible();
  await page.getByLabel("Date").fill("2026-07-10");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Schedule a Visit" })).toBeHidden();

  await page.getByPlaceholder("Type a message...").fill("Can I visit this weekend?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Can I visit this weekend?").last()).toBeVisible();
});

test("listing builder submits into moderation review", async ({ page }) => {
  await seedDevAuth(page, { clearListingDraft: true });
  await page.goto("/post");

  await expect(page.getByRole("heading", { name: "Basic Information" })).toBeVisible();
  await page.getByLabel("Title").fill("Sunny test room in Koramangala");
  await page.getByLabel("Monthly Rent").fill("22000");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Location" })).toBeVisible();
  await page.getByLabel("City").fill("Bangalore");
  await page.getByLabel("Locality").fill("Koramangala");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  for (const heading of ["Property Details", "Room Details", "Amenities", "Photos", "Preferences"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Review & Publish" })).toBeVisible();
  await page.getByRole("button", { name: "Publish Listing" }).click();
  await expect(page).toHaveURL(/\/post\/review\/\d+$/);
  await expect(page.getByRole("heading", { name: "Under Review" })).toBeVisible();
});

test("settings apply theme and palette tokens", async ({ page }) => {
  await seedDevAuth(page);
  await page.goto("/settings/appearance");

  await expect(page.locator("#main").getByRole("heading", { name: "Appearance" })).toBeVisible();
  await page.getByRole("button", { name: /^Dark/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /^Monsoon Teal/i }).click();
  await expect(page.locator("html")).toHaveAttribute("data-palette", "monsoon_teal");
});

test("admin moderation list links into prescreen and reports workflows", async ({ page }) => {
  await seedDevAuth(page, { admin: true });
  await page.goto("/admin/moderation/listings");

  await expect(page.getByRole("heading", { name: "Listing Review Queue" })).toBeVisible();
  await page.getByRole("link", { name: "Review" }).first().click();
  await expect(page).toHaveURL(/\/admin\/moderation\/prescreen\/.+/);
  await expect(page.getByRole("heading", { name: "Listing Review" })).toBeVisible();

  await page.goto("/admin/moderation/reports");
  await expect(page.getByRole("heading", { name: "Report Review Queue" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Suspend" }).first()).toBeVisible();
});
