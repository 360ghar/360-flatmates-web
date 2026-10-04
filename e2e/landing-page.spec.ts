import { expect, test } from "./fixtures/test";

test("the match demo scores answers live and keeps its score readable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const demo = page.getByRole("region", { name: "How do you live?" });
  const score = demo.getByRole("progressbar", { name: "Example compatibility score" });
  await expect(score).toBeVisible();
  const before = Number(await score.getAttribute("aria-valuenow"));
  expect(before).toBeGreaterThan(0);

  // One tab stop per group; the arrow keys move and choose.
  const sleep = demo.getByRole("radiogroup", { name: "When do you sleep?" });
  await sleep.getByRole("radio", { name: "Flexible" }).click();
  await expect(sleep.getByRole("radio", { name: "Flexible" })).toHaveAttribute("aria-checked", "true");
  await expect.poll(async () => Number(await score.getAttribute("aria-valuenow"))).toBeGreaterThan(before);

  // Radix moves focus on the next tick; hold the key the way a person does.
  await sleep.getByRole("radio", { name: "Flexible" }).focus();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(60);
  await page.keyboard.up("ArrowRight");
  await expect(sleep.getByRole("radio", { name: "Night owl" })).toHaveAttribute("aria-checked", "true");

  await expect(demo.getByRole("link", { name: "Start matching" })).toHaveAttribute("href", "/discover");
});

test("postcards link to real neighbourhoods and the FAQ works from the keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const cities = page.getByRole("region", { name: "Pick a neighbourhood." });
  await expect(cities.getByRole("link", { name: "Bangalore", exact: true })).toHaveAttribute("href", "/cities/bangalore");
  await expect(cities.getByRole("link", { name: "Koramangala" })).toHaveAttribute("href", "/cities/bangalore/koramangala");
  await expect(cities.getByRole("link", { name: "Gurugram", exact: true })).toHaveAttribute("href", "/cities/gurugram");

  const question = page.locator("summary").filter({ hasText: "How do you actually match people?" });
  await question.focus();
  await question.press("Enter");
  await expect(page.locator("details").filter({ has: question })).toHaveAttribute("open", "");
  await expect(page.getByText(/six parts of daily life/)).toBeVisible();
  await question.press("Space");
  await expect(page.locator("details").filter({ has: question })).not.toHaveAttribute("open");

  await expect(page.getByRole("region", { name: "Find your flatmate, not a nightmare." }).getByRole("link", { name: "List it free" })).toHaveAttribute("href", "/login?intent=list-property");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Start matching" })).toHaveAttribute("href", "/discover");
});

test("provides theme and navigation controls at every width without sideways scroll", async ({ page }) => {
  for (const width of [360, 768, 1023, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header.getByRole("button", { name: /^Theme:/ })).toBeVisible();
    await expect(header).toHaveCSS("height", "72px");
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    if (width < 1024) {
      const menu = header.getByRole("button", { name: "Open navigation menu" });
      await menu.click();
      await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
    } else {
      await expect(header.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    }
  }
  await page.getByRole("banner").getByRole("button", { name: "Theme: Light. Switch to Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("the landing page needs no photos to render", async ({ page }) => {
  await page.route("https://images.unsplash.com/**", (route) => route.abort());
  await page.goto("/");
  for (const name of ["How do you live?", "From match to move-in.", "Pick a neighbourhood.", "Questions, answered."]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
  await expect(page.locator("main img")).toHaveCount(0);
});
