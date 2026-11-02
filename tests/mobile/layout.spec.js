const { test, expect } = require('../../fixtures/pages.fixture');
const { allProducts } = require('../../data/products');

// Proves the mobile-chrome project really renders the phone layout, and that the check can tell the two apart.
// Keyed on the project name, not `isMobile`: if the project lost its device settings, `isMobile` would turn
// false and both tests would quietly skip or pass.
const PHONE_PROJECT = 'mobile-chrome';

test.describe('layout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
  });

  test('lists products in one column on a phone @regression', async ({ page, inventoryPage, isMobile }) => {
    test.skip(test.info().project.name !== PHONE_PROJECT, 'phone layout only');

    expect(isMobile).toBe(true);
    expect(page.viewportSize().width).toBeLessThan(500);
    await expect.poll(() => inventoryPage.columnCount()).toBe(1);
  });

  test('lists products in two columns on desktop @regression', async ({ inventoryPage }) => {
    test.skip(test.info().project.name === PHONE_PROJECT, 'desktop layout only');

    await expect.poll(() => inventoryPage.columnCount()).toBe(2);
  });
});
