import { expect, seedDevAuth, test } from "./fixtures/test";

/* Every control that looks interactive answers a real pointer and the keyboard. */

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seedDevAuth(page);
});

test("the More tab opens a sheet of the other pages and Escape closes it", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/home");
  const more = page.getByRole("navigation", { name: "Mobile primary" }).getByRole("button", { name: /^More/ });
  await more.click();
  const sheet = page.getByRole("dialog", { name: "More" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("link", { name: /Visits/ })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(more).toBeFocused();
});

test("the sidebar collapses to an icon rail and expands again", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/home");
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
});

test("role cards are one radio group that the arrow keys move through", async ({ page }) => {
  await page.goto("/choose-role");
  const group = page.getByRole("radiogroup", { name: "How will you use 360?" });
  await group.getByRole("radio", { name: /Room poster/ }).click();
  await expect(group.getByRole("radio", { name: /Room poster/ })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(60);
  await page.keyboard.up("ArrowDown");
  await expect(group.getByRole("radio", { name: /Room seeker/ })).toHaveAttribute("aria-checked", "true");
});

test("deleting the account needs the word DELETE, and Cancel closes the dialog", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: /Delete account/ }).click();
  const dialog = page.getByRole("dialog", { name: "Delete your account?" });
  const confirm = dialog.getByRole("button", { name: "Delete account" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
  await expect(confirm).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
});

test("the visits calendar filters the list to the picked day", async ({ page }) => {
  await page.goto("/visits");
  await page.getByRole("radio", { name: "Calendar" }).click();
  const day = page.getByRole("button", { name: /visit/ }).first();
  await day.click();
  await expect(day).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("article:visible").first()).toBeVisible();
  await day.click();
  await expect(day).toHaveAttribute("aria-pressed", "false");
});

test("likes switch to matches with the segmented control", async ({ page }) => {
  await page.goto("/likes");
  await page.getByRole("radio", { name: "Matches" }).click();
  await expect(page.getByRole("radio", { name: "Matches" })).toHaveAttribute("aria-checked", "true");
});

test("a compatibility row opens the scale for that part of daily life", async ({ page }) => {
  await page.goto("/compatibility/2");
  await page.getByRole("button", { name: /Sleep schedule/ }).click();
  const dialog = page.getByRole("dialog", { name: "Sleep schedule" });
  await expect(dialog.getByRole("list", { name: "The scale, in order" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
