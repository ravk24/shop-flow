const { test, expect } = require('../../fixtures/pages.fixture');
const { products, allProducts } = require('../../data/products');
const { users } = require('../../data/users');

test.describe('console errors', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
  });

  test.describe('collecting', () => {
    test.use({ failOnConsoleErrors: false });

    test('collects a console.error @regression @negative', async ({ page, consoleErrors }) => {
      await page.evaluate(() => console.error('planted console'));

      await expect.poll(() => consoleErrors).toContain('planted console');
    });

    test('collects an uncaught exception @regression @negative', async ({ page, consoleErrors }) => {
      await page.evaluate(() => {
        setTimeout(() => {
          throw new Error('planted throw');
        });
      });

      await expect.poll(() => consoleErrors.join()).toContain('planted throw');
    });

    test('still collects a missing resource @regression @negative', async ({ page, consoleErrors, browserName }) => {
      test.skip(browserName === 'firefox', 'Firefox does not log failed resources to the console');

      await page.evaluate(() => fetch('/definitely-missing.png'));

      await expect.poll(() => consoleErrors.join()).toContain('status of 404');
    });
  });

  test('fails a test that logs an error @regression @negative', async ({ page, consoleErrors }) => {
    // Expected to fail, in the fixture's teardown. If the fixture stops failing tests, this goes red.
    test.fail();

    await page.evaluate(() => console.error('planted failure'));

    await expect.poll(() => consoleErrors).toContain('planted failure');
  });
});

test.describe('console errors - error_user', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(users.error.username, users.error.password);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
  });

  test.describe('known bug', () => {
    test.use({ failOnConsoleErrors: false });

    test('adding the Bolt T-Shirt throws for error_user @regression @negative', async ({ inventoryPage, consoleErrors }) => {
      // Known bug: three products throw and aren't added. If it's fixed, this goes red, which is the cue to remove it.
      await inventoryPage.addToCart(products.boltTShirt.name);

      await expect.poll(() => consoleErrors).toContain('Failed to add item to the cart.');
      await expect(inventoryPage.header.cartBadge).toBeHidden();
    });
  });

  test('adding the Backpack works for error_user @regression', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(products.backpack.name);

    await expect(inventoryPage.header.cartBadge).toHaveText('1');
  });
});
