const { test, expect } = require('../../fixtures/pages.fixture');
const { products } = require('../../data/products');
const { invalidCustomers } = require('../../data/checkout.data');
const { formatPrice, orderTotals } = require('../../utils/price');
const { startCheckout, reachOverview } = require('./checkout.helpers');

const { backpack } = products;

// Computed out here, not in the test body, so a bad lookup can't pass as the expected failure.
const floatCart = [products.bikeLight, products.fleeceJacket];
const correctSubtotal = `Item total: ${formatPrice(orderTotals(floatCart).subtotal)}`;

test.describe('checkout - invalid input', () => {
  for (const c of invalidCustomers) {
    test(`rejects ${c.name} at checkout @regression @negative`, async ({ page, inventoryPage, cartPage }) => {
      const checkoutInfoPage = await startCheckout({ inventoryPage, cartPage }, [backpack]);

      await checkoutInfoPage.fillCustomer(c.customer);
      await checkoutInfoPage.continue();

      await expect(checkoutInfoPage.errorMessage).toHaveText(c.error);
      await expect(page).toHaveURL('/checkout-step-one.html');
    });
  }

  test('allows direct navigation to the overview with an empty cart @regression @negative', async ({ page, checkoutOverviewPage }) => {
    await checkoutOverviewPage.goto();

    // SauceDemo allows this, which lets you place an empty order.
    // The test documents that behaviour rather than endorsing it.
    await expect(page).toHaveURL('/checkout-step-two.html');
    await expect(checkoutOverviewPage.items).toHaveCount(0);
    await expect(checkoutOverviewPage.subtotalLabel).toHaveText('Item total: $0');
    await expect(checkoutOverviewPage.taxLabel).toHaveText('Tax: $0.00');
    await expect(checkoutOverviewPage.totalLabel).toHaveText('Total: $0.00');
    await expect(checkoutOverviewPage.finishButton).toBeVisible();
  });
});

test.describe('checkout - known bugs', () => {
  // Arranged here because a failure in beforeEach stays red, while a failure in a test.fail body doesn't.
  test.beforeEach(async ({ inventoryPage, cartPage }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, floatCart);
    await expect(overview.title).toHaveText('Checkout: Overview');
  });

  test('shows the item total rounded to cents @regression @negative', async ({ checkoutOverviewPage }) => {
    // Known bug: 18 of the 63 possible carts show a raw float, here $59.980000000000004.
    // This spends the full 5 s expect timeout on every run, waiting for text that never appears. That's expected.
    test.fail();

    await expect(checkoutOverviewPage.subtotalLabel).toHaveText(correctSubtotal);
  });
});
