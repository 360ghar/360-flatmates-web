import { test as base, expect, type Page } from "@playwright/test";
import { installApiMocks } from "./api";

export interface DevAuthOptions {
  admin?: boolean;
  clearListingDraft?: boolean;
}

export async function seedDevAuth(page: Page, options: DevAuthOptions = {}) {
  await page.addInitScript((opts: DevAuthOptions) => {
    window.localStorage.setItem("flatmates-playwright-auth", "true");
    if (opts.admin) {
      window.localStorage.setItem("flatmates-playwright-admin", "true");
    } else {
      window.localStorage.removeItem("flatmates-playwright-admin");
    }
    if (opts.clearListingDraft) {
      window.localStorage.removeItem("360-flatmates-listing-draft");
    }
  }, options);
}

export async function delayApiResponse(
  page: Page,
  path: string | RegExp,
  delayMs = 750
) {
  await page.route("**/api/v1/**", async (route) => {
    const apiPath = new URL(route.request().url()).pathname.replace(/^\/api\/v1/, "");
    const matches = typeof path === "string" ? apiPath === path : path.test(apiPath);
    if (!matches) {
      await route.fallback();
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.fallback();
  });
}

export const test = base.extend({
  page: async ({ page }, run) => {
    await installApiMocks(page);
    await run(page);
  },
});

export { expect };
