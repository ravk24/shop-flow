import { test, expect } from '../fixtures/automationexercise.fixture';
import { describeViolations } from '../utils/a11y';

test.describe('automationexercise accessibility', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();
  });

  // Known violations (recon 2026-11-03): an icon-only subscribe button with no accessible name (button-name)
  // and low-contrast text (color-contrast). Every page checked has both. When the site fixes them,
  // this reports "Expected to fail, but passed": remove test.fail() then.
  test('has no WCAG violations on the login page @a11y @regression', async ({ makeAxeBuilder }) => {
    test.fail();
    const { violations } = await makeAxeBuilder().analyze();
    expect(describeViolations(violations)).toEqual([]);
  });
});
