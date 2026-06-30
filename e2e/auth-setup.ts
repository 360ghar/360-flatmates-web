import { test as setup, expect } from "@playwright/test";
import fs from "fs";

/**
 * Opt-in real-auth setup. The default Playwright suite does not depend on this
 * file; local authenticated coverage uses the DEV-only localStorage marker from
 * e2e/fixtures/test.ts plus deterministic API mocks.
 */

const AUTH_FILE = ".auth/user.json";

setup("authenticate test user", async ({ page }) => {
  setup.skip(!process.env.E2E_REAL_AUTH, "Real auth storage state is opt-in.");

  // Navigate to the login page
  await page.goto("/login");

  // Verify we are on the login page
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();

  // Switch to OTP mode (default)
  const otpTab = page.getByRole("tab", { name: /phone otp/i });
  if (await otpTab.isVisible()) {
    await otpTab.click();
  }

  // Fill phone number — use multiple strategies to trigger form validation
  const phoneInput =
    page.getByLabel(/phone/i) ||
    page.getByPlaceholder(/\+91/) ||
    page.locator('input[type="tel"]');

  if (await phoneInput.first().isVisible()) {
    const input = phoneInput.first();
    await input.click();
    await input.fill("9999999999");
    // Tab away to trigger blur/validation
    await input.press("Tab");
    // Wait a moment for React state to update
    await page.waitForTimeout(500);
  }

  // Click "Send OTP" — button may be disabled if validation hasn't triggered
  const sendOtpButton = page.getByRole("button", { name: /send otp/i });
  try {
    await sendOtpButton.waitFor({ state: "visible", timeout: 3_000 });
    const isEnabled = await sendOtpButton.isEnabled();
    if (isEnabled) {
      await sendOtpButton.click();

      // Wait for either the OTP input to appear or an error message
      const otpInput = page.getByLabel(/otp/i);
      try {
        await otpInput.waitFor({ state: "visible", timeout: 5_000 });
        await otpInput.fill("123456");
        const verifyButton = page.getByRole("button", { name: /verify/i });
        if (await verifyButton.isVisible()) {
          await verifyButton.click();
        }
      } catch {
        // Backend not available — save whatever state we have
      }
    }
  } catch {
    // Send OTP button not visible or not enabled — skip auth attempt
  }

  // Save only real browser state produced by the auth attempt.
  await page.context().storageState({ path: AUTH_FILE });
  const state = JSON.parse(fs.readFileSync(AUTH_FILE, "utf-8"));
  const hasSupabaseCookie = state.cookies?.some((cookie: { name: string }) =>
    /^sb-.+-auth-token$/.test(cookie.name)
  );

  if (!hasSupabaseCookie) {
    throw new Error("Real auth setup did not produce a Supabase auth cookie.");
  }
});
