const { test, expect } = require('../../fixtures/pages.fixture');
const { users } = require('../../data/users');
const { expectLoggedOut } = require('./auth.helpers');

// These tests must start logged out.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('login', () => {
  test.beforeEach(async ({ context }) => {
    await expectLoggedOut(context);
  });

  test('logs in as standard_user and lands on inventory @smoke @regression', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('logs out from the burger menu and returns to the login page @regression', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(inventoryPage.title).toHaveText('Products');

    await inventoryPage.header.logout();

    await expect(page).toHaveURL('/');
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('logs in as performance_glitch_user without explicit waits @regression', async ({ page, loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(users.performanceGlitch.username, users.performanceGlitch.password);

    // This user's page stalls for about 5 s after login. If toHaveURL returns before the stall, the title
    // appears about 5.07 s later, past the 5 s default, so the title check needs a higher limit. If toHaveURL
    // runs into the stall it waits it out instead, and the title is already there.
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products', { timeout: 10_000 });
  });
});
