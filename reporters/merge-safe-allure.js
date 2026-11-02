const { AllureReporter } = require('allure-playwright');

// allure-playwright 3.14.0 reads `config.projects[0]` in onConfigure, but merge-reports passes no projects
// at that point. It throws, the merge reports an error and exits 1, and CI goes red although every
// result was written. Those two values only de-duplicate screenshot diffs, so skipping them is safe.
class MergeSafeAllureReporter extends AllureReporter {
  onConfigure(config) {
    if (config.projects.length > 0) {
      super.onConfigure(config);
    } else {
      this.config = config;
    }
  }
}

module.exports = MergeSafeAllureReporter;
