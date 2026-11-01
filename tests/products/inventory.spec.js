const { test, expect } = require('../../fixtures/pages.fixture');
const { users } = require('../../data/users');

const PRODUCT_COUNT = 6; // Phase 5 replaces this with data/products.js

test.describe('inventory', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
  });

  test('lists all six products with name, price, image and button @smoke @regression', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(PRODUCT_COUNT);
    await expect(inventoryPage.itemNames).toHaveText(Array(PRODUCT_COUNT).fill(/\S/));
    await expect(inventoryPage.itemPrices).toHaveText(Array(PRODUCT_COUNT).fill(/^\$\d+\.\d{2}$/));
    await expect(inventoryPage.itemImages).toHaveCount(PRODUCT_COUNT);
    await expect(inventoryPage.addToCartButtons).toHaveText(Array(PRODUCT_COUNT).fill('Add to cart'));
  });

  test('shows an empty cart in the header after login @regression', async ({ inventoryPage }) => {
    await expect(inventoryPage.header.cartLink).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
    await inventoryPage.header.openMenu();
    await expect(inventoryPage.header.logoutLink).toBeVisible();
  });
});
