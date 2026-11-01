// These tests must start logged out. Phase 4 adds storageState for all other
// specs; when it does, this file needs test.use({ storageState: { cookies: [], origins: [] } }).
const { test, expect } = require('../../fixtures/pages.fixture');
const { users } = require('../../data/users');

const invalidLogins = [
  {
    name: 'wrong password',
    username: users.standard.username,
    password: 'wrong_password',
    error: 'Epic sadface: Username and password do not match any user in this service',
  },
  {
    name: 'empty username and password',
    username: '',
    password: '',
    error: 'Epic sadface: Username is required',
  },
  {
    name: 'empty password',
    username: users.standard.username,
    password: '',
    error: 'Epic sadface: Password is required',
  },
];

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
    test(`shows "${c.error}" for ${c.name} @regression @negative`, async ({ page, loginPage }) => {
      await loginPage.login(c.username, c.password);

      await expect(loginPage.errorMessage).toHaveText(c.error);
      await expect(page).toHaveURL('/');
    });
  }

  test('redirects direct navigation to inventory back to login with an error @regression @negative', async ({ page, loginPage, inventoryPage }) => {
    await inventoryPage.goto();

    await expect(page).toHaveURL('/');
    await expect(loginPage.errorMessage).toHaveText(
      "Epic sadface: You can only access '/inventory.html' when you are logged in."
    );
  });

  test('dismisses the error message with the X button @regression @negative', async ({ loginPage }) => {
    await loginPage.login(users.lockedOut.username, users.lockedOut.password);
    await expect(loginPage.errorMessage).toBeVisible();

    await loginPage.dismissError();

    await expect(loginPage.errorMessage).toBeHidden();
  });
});
