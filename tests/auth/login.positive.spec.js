const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { InventoryPage } = require('../../pages/InventoryPage');

// Phase 2: locators live in page objects. Phase 3 moves credentials to data/users.js.
const username = process.env.STANDARD_USER || 'standard_user';
const password = process.env.PASSWORD || 'secret_sauce';

test.describe('login', () => {
  test('logs in as standard_user and lands on inventory @smoke', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(username, password);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });
});
