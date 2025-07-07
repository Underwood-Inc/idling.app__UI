import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Set consistent test environment variables
// CRITICAL: Use the same NEXTAUTH_SECRET as the CI environment
const testEnvVars = {
  NODE_ENV: process.env.NODE_ENV || 'test',
  // Use the CI secret if available, otherwise fall back to a consistent test secret
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-secret-for-playwright-fallback',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000'
};

// Apply environment variables
Object.assign(process.env, testEnvVars);

/**
 * Playwright Configuration - E2E Tests ONLY
 * This is completely separate from Jest (unit/integration tests)
 * 
 * File patterns:
 * - Playwright: e2e slash star star slash star.spec.ts
 * - Jest: src slash star star slash star.test.{ts,tsx}
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
        ['html', { outputFolder: 'playwright-report', open: 'never' }]
      ]
    : [['list'], ['html', { open: 'never' }]],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://127.0.0.1:3000',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Save test artifacts in project-specific directories */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    /* Global test timeout */
    actionTimeout: 10000,
    navigationTimeout: 30000
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
            command: 'echo "======================building..."; NODE_ENV=test pnpm build; NODE_ENV=test pnpm start;',
    stdout: 'pipe',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    // CRITICAL: Pass the same environment variables to the web server
    env: {
      ...testEnvVars,
      // Ensure the web server gets the same NEXTAUTH_SECRET as the tests
      NEXTAUTH_SECRET: testEnvVars.NEXTAUTH_SECRET
    }
  },
  
  /* Global timeout for each test */
  timeout: 30000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 5000
  }
});
