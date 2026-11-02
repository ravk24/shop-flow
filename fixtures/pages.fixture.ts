import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { isKnownNoise, TELEMETRY_URL } from '../utils/console';
import { WCAG_TAGS } from '../utils/a11y';

type Options = {
  // Set to false with test.use() to read errors from `consoleErrors` instead of failing on them.
  failOnConsoleErrors: boolean;
};

type Fixtures = {
  stubTelemetry: void;
  consoleErrors: string[];
  makeAxeBuilder: () => AxeBuilder;
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  productDetailPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutOverviewPage: CheckoutOverviewPage;
};

export const test = base.extend<Fixtures & Options>({
  failOnConsoleErrors: [true, { option: true }],

  // SauceDemo posts telemetry to a third-party service with placeholder credentials. Answering it here keeps
  // the tests independent of that service: its 401s, and its occasional 5xx (which WebKit reports as CORS
  // errors that name no URL), never reach the console check.
  stubTelemetry: [
    async ({ page }, use) => {
      await page.route(TELEMETRY_URL, (route) =>
        route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, body: '{}' }),
      );
      await use();
    },
    { auto: true },
  ],

  // Runs for every test. Fails it at the end if the page logged an error or threw.
  // Limits: it watches this `page` only, can miss an error after a test's last action, and doesn't see alerts.
  consoleErrors: [
    async ({ page, failOnConsoleErrors }, use) => {
      const errors: string[] = [];
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

export { expect };
