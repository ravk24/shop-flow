const { test, expect } = require('../../fixtures/pages.fixture');
const { allProducts } = require('../../data/products');

// Proves the mobile-chrome project really renders the phone layout, and that the check can tell the two apart.
test.describe('layout', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
  });

  test('lists products in one column on a phone @regression', async ({ inventoryPage, isMobile }) => {
    test.skip(!isMobile, 'phone layout only');

    await expect.poll(() => inventoryPage.columnCount()).toBe(1);
  });

  test('lists products in two columns on desktop @regression', async ({ inventoryPage, isMobile }) => {
    test.skip(isMobile, 'desktop layout only');

    await expect.poll(() => inventoryPage.columnCount()).toBe(2);
  });
});
