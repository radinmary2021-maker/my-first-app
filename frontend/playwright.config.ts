import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E configuration for Nobatic.
 *
 * Strategy: all API calls are intercepted via page.route() in each spec so the
 * backend does NOT need to be running.  Only the Vite dev server is required.
 *
 * Selectors: prefer data-testid → ARIA role → label → text (in that order).
 * No arbitrary waits — always use expect() with built-in retry, or waitForURL/
 * waitForResponse.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run each spec file sequentially to avoid port / state conflicts */
  fullyParallel: false,
  workers: 1,

  /* Fail fast in CI */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:5173',

    /* Persist enough context for assertions; discard on success */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',

    /* RTL app — keep viewport consistent */
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use system Chrome to avoid bundled Chromium SxS runtime issues on Windows
        channel: 'chrome',
      },
    },
  ],

  /**
   * Start the Vite dev server automatically.
   * reuseExistingServer lets developers keep their own dev server running.
   * The VITE_API_BASE_URL override makes Axios send requests to localhost:5173
   * so Playwright's route interceptors (which run in-process) catch everything
   * before the proxy forwards them.
   */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Empty baseURL → Axios calls /api/... → Vite proxy handles it
      // Playwright intercepts at browser level before the proxy forwards.
      VITE_API_BASE_URL: '',
    },
  },
})
