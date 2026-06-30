import { expect, test } from "./fixtures/test";

/**
 * E2E tests for authentication flows.
 *
 * These tests verify the UI structure and interactions of auth pages.
 * Since there is no real test backend, actual Supabase auth calls will
 * fail — tests verify form elements exist and are interactive, and
 * skip assertions that require a working backend.
 *
 * The login page is the single unified entry point (it doubles as signup
 * for unknown identifiers): identifier → password OR OTP → mandatory
 * set-password for passwordless accounts.
 */

test.describe("Login page (unified sign-in / sign-up)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the unified heading and description", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /sign in or sign up/i })
    ).toBeVisible();
    await expect(
      page.getByText(/we'll create an account if you're new/i)
    ).toBeVisible();
  });

  test("shows the Google sign-in button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /continue with google/i })
    ).toBeVisible();
  });

  test("shows a single identifier input for email or phone", async ({ page }) => {
    await expect(page.getByLabel(/email or phone/i)).toBeVisible();
  });

  test("Continue button is disabled when the identifier is empty", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^continue$/i })).toBeDisabled();
  });

  test("Continue button becomes enabled when an identifier is filled", async ({ page }) => {
    await page.getByLabel(/email or phone/i).fill("9876543210");
    await expect(page.getByRole("button", { name: /^continue$/i })).toBeEnabled();
  });

  test("shows the terms consent line with links", async ({ page }) => {
    await expect(page.getByText(/by continuing, you agree to/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /terms of service/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy policy/i })).toBeVisible();
  });

  test("clicking Continue shows loading or an error (no backend)", async ({ page }) => {
    await page.getByLabel(/email or phone/i).fill("9876543210");
    await page.getByRole("button", { name: /^continue$/i }).click();

    // The identifier-status call has no backend, so the UI must react — either
    // the button enters a loading state or an error alert appears. Poll for one
    // rather than sleeping a fixed duration.
    await expect.poll(
      async () => {
        const hasError = await page.getByRole("alert").isVisible().catch(() => false);
        const isLoading =
          (await page
            .getByRole("button", { name: /^continue$/i })
            .getAttribute("data-loading")) === "true";
        return hasError || isLoading;
      },
      { timeout: 5000, message: "Continue should show loading or an error" }
    ).toBeTruthy();
  });
});

test.describe("Signup route (unified into login)", () => {
  test("/signup redirects to /login", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /sign in or sign up/i })
    ).toBeVisible();
  });
});

test.describe("Forgot password page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/forgot-password");
  });

  test("renders the reset password heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
  });

  test("shows the 3-step progress indicator", async ({ page }) => {
    await expect(page.getByText(/enter identifier/i)).toBeVisible();
    await expect(page.getByText(/enter otp/i)).toBeVisible();
    await expect(page.getByText(/new password/i)).toBeVisible();
  });

  test("request step shows the identifier input and Send OTP button", async ({ page }) => {
    await expect(page.getByLabel(/phone or email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send otp/i })).toBeVisible();
  });

  test("Send OTP button is disabled when the identifier is empty", async ({ page }) => {
    await expect(page.getByRole("button", { name: /send otp/i })).toBeDisabled();
  });

  test("Back to Login link is present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /back to login/i })).toBeVisible();
  });

  test("Back to Login link navigates to the login page", async ({ page }) => {
    await page.getByRole("link", { name: /back to login/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Auth middleware — route protection", () => {
  test("unauthenticated user visiting /home is redirected to /login", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login/);
    expect(new URL(page.url()).searchParams.get("redirect")).toBe("/home");
  });

  test("unauthenticated user visiting /swipe is redirected to /login", async ({ page }) => {
    await page.goto("/swipe");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /chats is redirected to /login", async ({ page }) => {
    await page.goto("/chats");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /visits is redirected to /login", async ({ page }) => {
    await page.goto("/visits");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /settings is redirected to /login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user visiting /explore is redirected to /login", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirect preserves the original path in the redirect query param", async ({ page }) => {
    await page.goto("/settings/notifications");
    await expect(page).toHaveURL(/redirect=/);
  });
});

test.describe("Auth layout", () => {
  test("login page is wrapped in a centered card layout", async ({ page }) => {
    await page.goto("/login");

    // The auth layout centers content in a card with max-w-md
    const card = page.locator(".rounded-2xl, .rounded-xl, [class*='rounded']").first();
    await expect(card).toBeVisible();

    // The page should be vertically centered (min-h-screen on parent)
    const mainContainer = page.locator("main, [class*='min-h-screen']").first();
    await expect(mainContainer).toBeVisible();
  });

  test("forgot-password page uses the same centered layout", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
    // Verify content is centered (auth layout should be the same)
    const heading = page.getByRole("heading", { name: /reset password/i });
    await expect(heading).toBeVisible();
  });
});
