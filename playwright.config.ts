import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [
        ['list'],
        ['json', { outputFile: 'test-results/report.json' }],
        ['html', { outputFolder: 'playwright-report' }]
      ]
    : [['list'], ['html']],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Save test artifacts in project-specific directories */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testDir: './e2e',
      outputDir: 'test-results/chromium'
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testDir: './e2e',
      outputDir: 'test-results/firefox'
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testDir: './e2e',
      outputDir: 'test-results/webkit'
    }
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI
      ? 'yarn install --frozen-lockfile && NODE_ENV=production yarn build && yarn start'
      : 'NODE_ENV=production yarn build && yarn start',
    stdout: 'pipe',
    stderr: 'pipe',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180000, // 3 minutes timeout for build
    env: {
      // Force production environment for build
      NODE_ENV: 'production',
      // Disable telemetry
      NEXT_TELEMETRY_DISABLED: '1',
      // Ensure Next.js uses SWC
      DISABLE_BABEL: '1'
    }
  }
});
