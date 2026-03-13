import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for IZ ACCESS.
 *
 * Usage:
 *   npx playwright test              — run all E2E tests
 *   npx playwright test --ui         — interactive mode
 *   npx playwright test --project=chromium — single browser
 *
 * Requires: npx playwright install --with-deps
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],

  /* Start the dev server before tests (only in local) */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
