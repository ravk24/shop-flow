const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
const { ProductDetailPage } = require('../pages/ProductDetailPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutOverviewPage } = require('../pages/CheckoutOverviewPage');
const { default: AxeBuilder } = require('@axe-core/playwright');
const { isKnownNoise } = require('../utils/console');
const { WCAG_TAGS } = require('../utils/a11y');

exports.test = base.test.extend({
  failOnConsoleErrors: [true, { option: true }],

  // Runs for every test. Fails it at the end if the page logged an error or threw.
  // Limits: it watches this `page` only, can miss an error after a test's last action, and doesn't see alerts.
  consoleErrors: [
    async ({ page, failOnConsoleErrors }, use) => {
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && !isKnownNoise(message.text(), message.location().url)) {
          errors.push(message.text());
        }
      });
      page.on('pageerror', (error) => errors.push(error.message));

      await use(errors);

      if (failOnConsoleErrors && errors.length > 0) {
        throw new Error(`Unexpected console errors: ${errors.join(' | ')}`);
      }
    },
    { auto: true },
  ],

  // A fresh scanner per call, so a test can scan more than one state.
  makeAxeBuilder: async ({ page }, use) => use(() => new AxeBuilder({ page }).withTags(WCAG_TAGS)),

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  productDetailPage: async ({ page }, use) => use(new ProductDetailPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutOverviewPage: async ({ page }, use) => use(new CheckoutOverviewPage(page)),
});
exports.expect = base.expect;
