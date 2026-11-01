const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../../pages/LoginPage');
const { InventoryPage } = require('../../pages/InventoryPage');
const { users } = require('../../data/users');

test.describe('login', () => {
  test('logs in as standard_user and lands on inventory @smoke @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('logs out from the burger menu and returns to the login page @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(inventoryPage.title).toHaveText('Products');

    await inventoryPage.header.logout();

    await expect(page).toHaveURL('/');
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('logs in as performance_glitch_user without explicit waits @regression', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login(users.performanceGlitch.username, users.performanceGlitch.password);

    // This user stalls the page for about 5 s after login. Assertions wait it out with no sleep
    // and no raised timeout: in testing even a 100 ms limit passed, because the check can't report until the page responds.
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });
});
