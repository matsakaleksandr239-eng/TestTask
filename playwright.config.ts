import { defineConfig, devices } from '@playwright/test';

const authFile = '.auth/user.json';

export default defineConfig({
  testDir: '.',
  globalSetup: './utils/globalSetup.ts',
  // Screenshot baselines live in a gitignored top-level folder instead of next to their spec
  // files or under test-results/ (which Playwright wipes at the start of every run) — this way
  // they're never committed, but still survive between runs so each environment generates its
  // own baseline once and reuses it.
  snapshotDir: '.snapshots',
  fullyParallel: true,
  // All tests share one real account and one logged-in session (there's no second test account
  // to give each worker its own session) — concurrent requests on that one session occasionally
  // race the dev server into an error response, so a single worker keeps runs deterministic.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
  ],
});
