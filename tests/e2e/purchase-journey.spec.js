const { test, expect } = require('../../fixtures/pages.fixture');
const { allProducts } = require('../../data/products');
const { users } = require('../../data/users');
const { validCustomer } = require('../../data/checkout.data');
const { formatPrice, orderTotals } = require('../../utils/price');

// Starts logged out, because this journey covers logging in through the UI.
test.use({ storageState: { cookies: [], origins: [] } });

const byPrice = [...allProducts].sort((a, b) => a.price - b.price);
const cheapest = byPrice[0];
const mostExpensive = byPrice[byPrice.length - 1];
const bought = [cheapest, mostExpensive];
const expected = orderTotals(bought);

test.describe('purchase journey', () => {
  test('completes a purchase from login to an empty cart @smoke @regression', async ({ page, loginPage, inventoryPage, cartPage }) => {
    let overview;
    let complete;

    await test.step('log in', async () => {
      await loginPage.goto();
      await loginPage.login(users.standard.username, users.standard.password);

      await expect(page).toHaveURL('/inventory.html');
      await expect(inventoryPage.title).toHaveText('Products');
    });

    await test.step('sort by price, low to high', async () => {
      await inventoryPage.sortBy('Price (low to high)');

      await expect(inventoryPage.itemNames.first()).toHaveText(cheapest.name);
      await expect(inventoryPage.itemNames.last()).toHaveText(mostExpensive.name);
    });

    await test.step('add the cheapest and most expensive', async () => {
      await inventoryPage.addToCart(cheapest.name);
      await inventoryPage.addToCart(mostExpensive.name);

      await expect(inventoryPage.header.cartBadge).toHaveText('2');
    });

    await test.step('verify the cart', async () => {
      await inventoryPage.header.openCart();

      await expect(cartPage.itemNames).toHaveText(bought.map((p) => p.name));
      await expect(cartPage.itemPrices).toHaveText(bought.map((p) => formatPrice(p.price)));
    });

    await test.step('enter customer details', async () => {
      const checkoutInfoPage = await cartPage.checkout();
      await checkoutInfoPage.fillCustomer(validCustomer);
      overview = await checkoutInfoPage.continue();

      await expect(overview.title).toHaveText('Checkout: Overview');
    });

    await test.step('verify the totals', async () => {
      expect(await overview.subtotal()).toBe(expected.subtotal);
      expect(await overview.tax()).toBe(expected.tax);
      expect(await overview.total()).toBe(expected.total);
    });

    await test.step('finish the order', async () => {
      complete = await overview.finish();

      await expect(complete.completeHeader).toHaveText('Thank you for your order!');
    });

    await test.step('go back home with an empty cart', async () => {
      await complete.backHome();

      await expect(page).toHaveURL('/inventory.html');
      await expect(inventoryPage.title).toHaveText('Products');
      await expect(inventoryPage.header.cartBadge).toBeHidden();
    });
  });
});
