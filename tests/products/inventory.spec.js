const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { InventoryPage } = require('../../pages/InventoryPage');

const username = process.env.STANDARD_USER || 'standard_user';
const password = process.env.PASSWORD || 'secret_sauce';
const PRODUCT_COUNT = 6; // Phase 5 replaces this with data/products.js

test.describe('inventory', () => {
  let inventoryPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(username, password);
    inventoryPage = new InventoryPage(page);
  });

  test('lists all six products with name, price, image and button @smoke', async () => {
    await expect(inventoryPage.items).toHaveCount(PRODUCT_COUNT);
    await expect(inventoryPage.itemNames).toHaveText(Array(PRODUCT_COUNT).fill(/\S/));
    await expect(inventoryPage.itemPrices).toHaveText(Array(PRODUCT_COUNT).fill(/^\$\d+\.\d{2}$/));
    await expect(inventoryPage.itemImages).toHaveCount(PRODUCT_COUNT);
    await expect(inventoryPage.addToCartButtons).toHaveText(Array(PRODUCT_COUNT).fill('Add to cart'));
  });

  test('shows an empty cart in the header after login @regression', async () => {
    await expect(inventoryPage.header.cartLink).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
    await inventoryPage.header.openMenu();
    await expect(inventoryPage.header.logoutLink).toBeVisible();
  });
});
