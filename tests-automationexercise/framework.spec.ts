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

  test('ignores only a product picture shed under load @regression @negative', async ({ productsPage, page, consoleErrors }) => {
    await page.route('**/get_product_picture/1', (route) => route.fulfill({ status: 404, body: '' }));
    await page.route('**/get_product_picture/2', (route) => route.fulfill({ status: 503, body: '' }));
    await page.route('**/static/images/home/logo.png', (route) => route.fulfill({ status: 503, body: '' }));
    const shedPicture = page.waitForResponse('**/get_product_picture/2');

    await productsPage.goto();
    await shedPicture;

    // Counted: a missing picture, and a 503 on anything that isn't a product picture.
    await expect.poll(() => consoleErrors.join()).toMatch(/status of 404 .*\/get_product_picture\/1\)/);
    await expect.poll(() => consoleErrors.join()).toMatch(/status of 503 .*\/static\/images\/home\/logo\.png\)/);
    // Not counted: the shed picture. Its response arrived before the two messages above were seen.
    expect(consoleErrors.join()).not.toContain('get_product_picture/2');
  });
});
