// Used by CI's merge-reports job to turn the shards' blob reports into both reports at once.
// Reporters resolve from this file's folder, so it lives in the repo root.
module.exports = {
  testDir: './tests',
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['./reporters/merge-safe-allure.js', { resultsDir: 'allure-results' }],
  ],
};
