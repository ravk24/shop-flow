const { test, expect } = require('../../fixtures/pages.fixture');
const { users } = require('../../data/users');
const { invalidLogins } = require('../../data/login.data');
const { expectLoggedOut } = require('./auth.helpers');

// These tests must start logged out.
test.use({ storageState: { cookies: [], origins: [] } });

test.beforeEach(async ({ context }) => {
  await expectLoggedOut(context);
});

test.describe('login - negative', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('shows locked out error for locked_out_user @regression @negative', async ({ page, loginPage }) => {
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);

    await expect(loginPage.errorMessage).toHaveText('Epic sadface: Sorry, this user has been locked out.');
    await expect(page).toHaveURL('/');
  });

  for (const c of invalidLogins) {
    test(`rejects ${c.name} @regression @negative`, async ({ page, loginPage }) => {
      await loginPage.login(c.username, c.password);

      await expect(loginPage.errorMessage).toHaveText(c.error);
      await expect(page).toHaveURL('/');
    });
  }

  test('dismisses the error message with the X button @regression @negative', async ({ loginPage }) => {
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await expect(loginPage.errorMessage).toBeVisible();

    await loginPage.dismissError();

    await expect(loginPage.errorMessage).toBeHidden();
  });
});

// Outside the describe above, whose beforeEach would open the login page first.
test('redirects direct navigation to inventory back to login with an error @regression @negative', async ({
  page,
  loginPage,
  inventoryPage,
}) => {
  await inventoryPage.goto();

  await expect(page).toHaveURL('/');
  await expect(loginPage.errorMessage).toHaveText("Epic sadface: You can only access '/inventory.html' when you are logged in.");
});
