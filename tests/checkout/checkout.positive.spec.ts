import { test, expect } from '../../fixtures/pages.fixture';
import { products } from '../../data/products';
import { formatPrice, orderTotals } from '../../utils/price';
import { startCheckout, reachOverview } from './checkout.helpers';

const { backpack, bikeLight, fleeceJacket, onesie } = products;

const order = [backpack, bikeLight, onesie];
const expected = orderTotals(order);

test.describe('checkout', () => {
  test('completes checkout with one item @smoke @regression', async ({ page, inventoryPage, cartPage }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, [backpack]);

    const complete = await overview.finish();

    await expect(page).toHaveURL('/checkout-complete.html');
    await expect(complete.title).toHaveText('Checkout: Complete!');
    await expect(complete.completeHeader).toHaveText('Thank you for your order!');
    await expect(complete.backHomeButton).toHaveText('Back Home');
  });

  test("lists the cart's items on the overview @regression", async ({ inventoryPage, cartPage }) => {
    const added = [fleeceJacket, onesie, backpack];

    const overview = await reachOverview({ inventoryPage, cartPage }, added);

    await expect(overview.title).toHaveText('Checkout: Overview');
    await expect(overview.itemNames).toHaveText(added.map((p) => p.name));
    await expect(overview.itemPrices).toHaveText(added.map((p) => formatPrice(p.price)));
    await expect(overview.itemQuantities).toHaveText(['1', '1', '1']);
  });

  test('shows the item total as the sum of item prices @regression', async ({ inventoryPage, cartPage }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, order);

    expect(await overview.subtotal()).toBe(expected.subtotal);
  });

  test('charges tax at 8 percent of the item total @regression', async ({ inventoryPage, cartPage }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, order);

    expect(await overview.tax()).toBe(expected.tax);
  });

  test('shows the total as item total plus tax @regression', async ({ inventoryPage, cartPage }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, order);

    expect(await overview.total()).toBe(expected.total);
  });

  test('returns to the cart with items intact when cancelling step one @regression', async ({ page, inventoryPage, cartPage }) => {
    const added = [backpack, onesie];
    const checkoutInfoPage = await startCheckout({ inventoryPage, cartPage }, added);

    await checkoutInfoPage.cancel();

    await expect(page).toHaveURL('/cart.html');
    await expect(cartPage.itemNames).toHaveText(added.map((p) => p.name));
    await expect(cartPage.header.cartBadge).toHaveText('2');
  });

  test('returns to inventory with the cart intact when cancelling the overview @regression', async ({ page, inventoryPage, cartPage }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, [backpack, onesie]);
    // Step one and the overview both have a cancel button, and step one's leads to the cart,
    // so wait for the overview before clicking.
    await expect(overview.title).toHaveText('Checkout: Overview');

    await overview.cancel();

    await expect(page).toHaveURL('/inventory.html');
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.header.cartBadge).toHaveText('2');
  });

  test('clears the cart after back home @regression', async ({ page, inventoryPage, cartPage }) => {
    const overview = await reachOverview({ inventoryPage, cartPage }, [backpack]);
    const complete = await overview.finish();

    await complete.backHome();

    await expect(page).toHaveURL('/inventory.html');
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.header.cartBadge).toBeHidden();
    await expect(inventoryPage.removeButtons).toHaveCount(0);
  });
});
