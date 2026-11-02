import type AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures/pages.fixture';
import { products, allProducts } from '../../data/products';
import { describeViolations } from '../../utils/a11y';
import { startCheckout, reachOverview } from '../checkout/checkout.helpers';

const { backpack } = products;

// Each test reaches one page state, asserts it is there, then scans it against the WCAG A/AA rules.
async function expectNoViolations(makeAxeBuilder: () => AxeBuilder): Promise<void> {
  const { violations } = await makeAxeBuilder().analyze();
  expect(describeViolations(violations)).toEqual([]);
}

test.describe('accessibility - logged out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('has no WCAG violations on the login page with an error @a11y @regression', async ({ loginPage, makeAxeBuilder }) => {
    await loginPage.goto();
    await loginPage.login('', '');
    await expect(loginPage.errorMessage).toBeVisible();

    await expectNoViolations(makeAxeBuilder);
  });
});

test.describe('accessibility', () => {
  test('has no WCAG violations on the inventory page @a11y @regression', async ({ inventoryPage, makeAxeBuilder }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.items).toHaveCount(allProducts.length);

    await expectNoViolations(makeAxeBuilder);
  });

  test('has no WCAG violations with the menu open @a11y @regression', async ({ inventoryPage, makeAxeBuilder }) => {
    await inventoryPage.goto();
    await inventoryPage.header.openMenu();
    // toBeVisible would pass with the menu still off screen.
    await expect(inventoryPage.header.logoutLink).toBeInViewport();

    await expectNoViolations(makeAxeBuilder);
  });

  test('has no WCAG violations on the product detail page @a11y @regression', async ({
    inventoryPage,
    productDetailPage,
    makeAxeBuilder,
  }) => {
    await inventoryPage.goto();
    await inventoryPage.openProduct(backpack.name);
    await expect(productDetailPage.name).toHaveText(backpack.name);

    await expectNoViolations(makeAxeBuilder);
  });

  test('has no WCAG violations on the cart page @a11y @regression', async ({ inventoryPage, cartPage, makeAxeBuilder }) => {
    await inventoryPage.goto();
    await inventoryPage.addToCart(backpack.name);
    await inventoryPage.header.openCart();
    await expect(cartPage.items).toHaveCount(1);

    await expectNoViolations(makeAxeBuilder);
  });

  test('has no WCAG violations on checkout step one with an error @a11y @regression', async ({
    inventoryPage,
    cartPage,
    makeAxeBuilder,
  }) => {
    const checkoutInfoPage = await startCheckout({ inventoryPage, cartPage }, [backpack]);
    await checkoutInfoPage.continue();
    await expect(checkoutInfoPage.errorMessage).toBeVisible();

    await expectNoViolations(makeAxeBuilder);
  });

  test('has no WCAG violations on the checkout overview @a11y @regression', async ({ inventoryPage, cartPage, makeAxeBuilder }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, [backpack]);
    await expect(overview.title).toHaveText('Checkout: Overview');

    await expectNoViolations(makeAxeBuilder);
  });

  test('has no WCAG violations on the order complete page @a11y @regression', async ({ inventoryPage, cartPage, makeAxeBuilder }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, [backpack]);
    const complete = await overview.finish();
    await expect(complete.completeHeader).toHaveText('Thank you for your order!');

    await expectNoViolations(makeAxeBuilder);
  });

  test('reports an image without alt text @a11y @regression @negative', async ({ page, inventoryPage, makeAxeBuilder }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
    // Proves the gate can fail: the real pages pass it today. An inline 1x1 GIF, so no request 404s.
    await page.evaluate(() => {
      const image = document.createElement('img');
      image.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      document.body.append(image);
    });

    const { violations } = await makeAxeBuilder().analyze();

    expect(describeViolations(violations)).toContainEqual(expect.stringMatching(/^image-alt: /));
  });
});
