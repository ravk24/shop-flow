import { defineConfig } from '@playwright/test';

// Used by CI's merge-reports job to turn the shards' blob reports into one HTML report.
export default defineConfig({
  testDir: './tests',
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],
});
