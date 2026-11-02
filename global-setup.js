const fs = require('fs');

// allure-playwright never clears its results folder, so each run would add to the last one's and
// the report would count every test twice. Runs once per run, before any worker starts.
module.exports = async () => {
  fs.rmSync('allure-results', { recursive: true, force: true });
};
