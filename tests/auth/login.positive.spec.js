const { test, expect } = require('../../fixtures/pages.fixture');
const { users } = require('../../data/users');

// These tests must start logged out.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('login', () => {
  test.beforeEach(async ({ context }) => {
    // The login page renders even for a logged-in user, so these tests can't detect this themselves.
    expect(await context.cookies()).toEqual([]);
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

    // This user stalls the page after login, and the title appears about 5.07 s after the URL changes.
    // That is longer than the 5 s default, so a title check that starts before the stall needs a higher limit.
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(inventoryPage.title).toHaveText('Products', { timeout: 10_000 });
  });
});
