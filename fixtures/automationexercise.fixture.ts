import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AeProductsPage } from '../pages/automationexercise/AeProductsPage';
import { AeProductDetailPage } from '../pages/automationexercise/AeProductDetailPage';
import { AeCartPage } from '../pages/automationexercise/AeCartPage';
import { AeLoginPage } from '../pages/automationexercise/AeLoginPage';
import { AD_HOSTS, isAutomationExerciseNoise, watchPageErrors } from '../utils/console';
import { WCAG_TAGS } from '../utils/a11y';

type Options = {
  // Set to false with test.use() to read errors from `consoleErrors` instead of failing on them.
  failOnConsoleErrors: boolean;
};

type Fixtures = {
  blockAds: void;
  consoleErrors: string[];
  makeAxeBuilder: () => AxeBuilder;
  productsPage: AeProductsPage;
  productDetailPage: AeProductDetailPage;
  cartPage: AeCartPage;
  loginPage: AeLoginPage;
};

// The same shape as the SauceDemo fixture (fixtures/pages.fixture.ts), for a second app.
export const test = base.extend<Fixtures & Options>({
  failOnConsoleErrors: [true, { option: true }],

  // The site is ad-funded. Ads make pages slower and less predictable, and their consent dialog can cover the page.
  blockAds: [
    async ({ page }, use) => {
      await page.route(AD_HOSTS, (route) => route.abort());
      await use();
    },
    { auto: true },
  ],

  // Same gate as SauceDemo's, with this site's own noise filter.
  consoleErrors: [
    async ({ page, failOnConsoleErrors }, use) => {
      const errors = watchPageErrors(page, isAutomationExerciseNoise);

      await use(errors);

      if (failOnConsoleErrors && errors.length > 0) {
        throw new Error(`Unexpected console errors: ${errors.join(' | ')}`);
      }
    },
    { auto: true },
  ],

  makeAxeBuilder: async ({ page }, use) => use(() => new AxeBuilder({ page }).withTags(WCAG_TAGS)),

  productsPage: async ({ page }, use) => use(new AeProductsPage(page)),
  productDetailPage: async ({ page }, use) => use(new AeProductDetailPage(page)),
  cartPage: async ({ page }, use) => use(new AeCartPage(page)),
  loginPage: async ({ page }, use) => use(new AeLoginPage(page)),
});

export { expect };
