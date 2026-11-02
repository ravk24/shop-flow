import { test, expect } from '../../fixtures/pages.fixture';
import { products, allProducts } from '../../data/products';
import { users } from '../../data/users';
import { TELEMETRY_URL } from '../../utils/console';

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

test.describe('console errors - telemetry', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("answers SauceDemo's telemetry locally @regression", async ({ page, loginPage, inventoryPage }) => {
    // The real service answers 401, and sometimes a 5xx that WebKit reports as CORS errors. The stub answers 200.
    const telemetry = page.waitForResponse(TELEMETRY_URL);

    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(inventoryPage.items).toHaveCount(allProducts.length);

    expect((await telemetry).status()).toBe(200);
  });
});
