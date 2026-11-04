import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config({ quiet: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // On CI Playwright would put the last commit's message, author and email, and its diff, in the report,
  // which is published on a public site. CI also runs the tests without GITHUB_ACTIONS, so no Metadata box at all.
  captureGitInfo: { commit: false, diff: false },

  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/standard.json' },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/standard.json' },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/standard.json',
        // WebKit only: keep a trace of a failing first attempt, to diagnose its rare lost clicks.
        // Tracing every run in all browsers made Firefox clicks stall locally, so the others keep on-first-retry.
        trace: 'retain-on-failure-and-retries',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], storageState: '.auth/standard.json' },
      dependencies: ['setup'],
    },
  ],
});
