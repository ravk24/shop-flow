const fs = require('fs');
const { AllureReporter } = require('allure-playwright');

// allure-playwright 3.14.0 with two fixes. Both configs use this instead of the plain reporter.
class ShopFlowAllureReporter extends AllureReporter {
  constructor(options = {}) {
    super(options);
    this.resultsDir = options.resultsDir || 'allure-results';
  }

  // Under merge-reports, onConfigure gets no projects and the original throws on `config.projects[0]`.
  // The merge then reports an error and exits 1, and CI goes red although every result was written.
  // Those two values only de-duplicate screenshot diffs, so skipping them is safe.
  onConfigure(config) {
    if (config.projects.length > 0) {
      super.onConfigure(config);
    } else {
      this.config = config;
    }
  }

  // The original never clears its folder, so each run would add to the last one's and the report would count
  // every test twice. Clearing here, rather than in globalSetup, means it only happens when Allure writes.
  onBegin(suite) {
    fs.rmSync(this.resultsDir, { recursive: true, force: true });
    super.onBegin(suite);
  }
}

module.exports = ShopFlowAllureReporter;
