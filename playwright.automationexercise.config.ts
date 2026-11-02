import { defineConfig, devices } from '@playwright/test';

// The second target app, automationexercise.com. A separate config, so `npm test` and CI's blocking
// shards stay SauceDemo-only: this public, ad-funded site is sometimes overloaded, and its result
// shouldn't decide whether the build is green. Run it with `npm run test:automationexercise`.
export default defineConfig({
  testDir: './tests-automationexercise',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Two workers everywhere, to keep the load on someone else's site polite.
  workers: 2,
  timeout: 30_000,
  // A third-party site over the public internet: the add-to-cart confirmation alone takes about 1.4 s.
  expect: { timeout: 10_000 },

  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-automationexercise' }]],

  use: {
    baseURL: 'https://automationexercise.com',
    // The site's own test ids, on its forms only.
    testIdAttribute: 'data-qa',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'automationexercise-chromium', use: { ...devices['Desktop Chrome'] } }],
});
