import AxeBuilder from "@axe-core/playwright";
import { expect, seedDevAuth, test } from "./fixtures/test";

/**
 * axe (WCAG 2.1 A and AA) on the key routes, in both themes. Serious and
 * critical findings fail the test; the report names each rule and target.
 */
const PUBLIC = ["/", "/discover", "/cities/bangalore", "/blog", "/about", "/terms", "/login", "/not-found-xyz"];
const APP = ["/home", "/swipe", "/chats", "/chats/201", "/visits", "/profile", "/profile/2", "/compatibility/2", "/explore", "/post", "/settings/appearance"];

for (const theme of ["light", "dark"] as const) {
  test.describe(`axe (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript((t) => localStorage.setItem("360-flatmates-ui", JSON.stringify({ state: { theme: t }, version: 0 })), theme);
    });

    for (const path of [...PUBLIC, ...APP]) {
      test(path, async ({ page }) => {
        if (APP.includes(path)) await seedDevAuth(page);
        await page.goto(path);
        await page.waitForLoadState("networkidle").catch(() => undefined);
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          // Leaflet's own tile images and attribution are third-party markup.
          .exclude(".leaflet-tile-pane")
          .exclude(".leaflet-control-attribution")
          .analyze();
        const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
        expect(
          serious.map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`),
          `axe on ${path} (${theme})`
        ).toEqual([]);
      });
    }
  });
}
