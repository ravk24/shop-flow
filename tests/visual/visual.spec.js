const fs = require('fs');
const { test, expect } = require('../../fixtures/pages.fixture');
const { products, allProducts } = require('../../data/products');
const { users } = require('../../data/users');

// Baselines are per browser and per OS (win32 locally, linux on CI). See the README to update them.
test.describe('visual', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
  });

  test('matches the inventory page @visual @regression', async ({ page }) => {
    await expect(page).toHaveScreenshot('inventory.png', { fullPage: true });
  });

  test('matches the cart page with one item @visual @regression', async ({ page, inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(products.backpack.name);
    await inventoryPage.header.openCart();
    await expect(cartPage.items).toHaveCount(1);

    await expect(page).toHaveScreenshot('cart.png', { fullPage: true });
  });
});

test.describe('visual - visual_user', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(users.visual.username, users.visual.password);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
  });

  test('matches the inventory page for visual_user @visual @regression @negative', async ({ page, inventoryPage }) => {
    // This compares against standard_user's baseline. While snapshots are being written it would replace
    // that baseline with visual_user's broken page, so it only runs against an existing one.
    const { updateSnapshots } = test.info().config;
    const baseline = test.info().snapshotPath('inventory.png', { kind: 'screenshot' });
    test.skip(
      updateSnapshots === 'all' || updateSnapshots === 'changed' || !fs.existsSync(baseline),
      'compares against the standard_user baseline, never writes it',
    );
    // Known app behaviour: visual_user shifts icons, a button and product names, and swaps the backpack image.
    test.fail();

    // Prices are random on every load for this user, so they are masked.
    await expect(page).toHaveScreenshot('inventory.png', { fullPage: true, mask: [inventoryPage.itemPrices] });
  });
});
