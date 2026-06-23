import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    // Auth setup project — runs first to save storage state for authenticated tests
    {
      name: "auth-setup",
      testMatch: /auth-setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Desktop Chromium — unauthenticated tests
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["auth-setup"],
    },

    // Mobile — unauthenticated tests
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      dependencies: ["auth-setup"],
    },

    // Authenticated desktop — tests that require a logged-in session
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/user.json",
      },
      dependencies: ["auth-setup"],
    },
  ]
});
