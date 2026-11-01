const { test: setup, expect } = require('../fixtures/pages.fixture');
const { users } = require('../data/users');

setup('authenticate as standard_user', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(inventoryPage.title).toHaveText('Products');
  await page.context().storageState({ path: '.auth/standard.json' });
});
