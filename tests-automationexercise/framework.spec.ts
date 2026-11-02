import { test, expect } from '../fixtures/automationexercise.fixture';

// Checks of this suite's own safety nets. Both are routed or planted locally, so they put no load on the site.
test.describe('automationexercise framework checks', () => {
  test.use({ failOnConsoleErrors: false });

  test('names an overloaded site when a page answers 503 @regression @negative', async ({ productsPage, page }) => {
    await page.route('**/products', (route) =>
      route.fulfill({ status: 503, contentType: 'text/html', body: 'This website is under heavy load (queue full)' }),
    );

    await expect(productsPage.goto()).rejects.toThrow('automationexercise.com answered 503 for /products');
  });

  test('counts a console error that is not known noise @regression @negative', async ({ productsPage, page, consoleErrors }) => {
    await productsPage.goto();
    await expect(productsPage.heading).toHaveText('All Products');
    // goto waited for the load event, so the font and blocked-ad errors have arrived; the filter dropped them.
    expect(consoleErrors).toEqual([]);

    await page.evaluate(() => console.error('planted error'));

    await expect.poll(() => consoleErrors).toEqual(['planted error']);
  });

  test('counts a missing resource from the site, but not one shed under load @regression @negative', async ({
    productsPage,
    page,
    consoleErrors,
  }) => {
    await page.route('**/get_product_picture/1', (route) => route.fulfill({ status: 404, body: '' }));
    await page.route('**/get_product_picture/2', (route) => route.fulfill({ status: 503, body: '' }));

    await productsPage.goto();

    await expect.poll(() => consoleErrors.join()).toContain('status of 404');
    expect(consoleErrors.join()).toContain('get_product_picture/1');
    expect(consoleErrors.join()).not.toContain('status of 503');
  });
});
