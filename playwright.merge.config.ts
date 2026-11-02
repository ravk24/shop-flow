import { defineConfig } from '@playwright/test';

// Used by CI's merge-reports job to turn the shards' blob reports into both reports at once.
// Reporters resolve from this file's folder, so it lives in the repo root.
export default defineConfig({
  testDir: './tests',
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['./reporters/allure.ts', { resultsDir: 'allure-results' }],
  ],
});
