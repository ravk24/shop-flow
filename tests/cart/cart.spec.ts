import { test, expect } from '../../fixtures/pages.fixture';
import { products } from '../../data/products';
import { formatPrice } from '../../utils/price';

const { backpack, bikeLight, boltTShirt, fleeceJacket, onesie } = products;

test.describe('cart', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('adds one product from inventory @smoke @regression', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(backpack.name);

    await expect(inventoryPage.header.cartBadge).toHaveText('1');
    await expect(inventoryPage.removeButtonFor(backpack.name)).toHaveText('Remove');
  });

  test('adds three products @regression', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(backpack.name);
    await inventoryPage.addToCart(onesie.name);
    await inventoryPage.addToCart(boltTShirt.name);

    await expect(inventoryPage.header.cartBadge).toHaveText('3');
  });

  test('removes a product from the inventory page @regression', async ({ inventoryPage }) => {
    await inventoryPage.addToCart(backpack.name);
    await inventoryPage.addToCart(onesie.name);

    await inventoryPage.removeFromCart(backpack.name);

    await expect(inventoryPage.header.cartBadge).toHaveText('1');
    await expect(inventoryPage.addToCartButtonFor(backpack.name)).toHaveText('Add to cart');
    await expect(inventoryPage.removeButtonFor(onesie.name)).toHaveText('Remove');
  });

  test('shows added items with name, price and quantity @regression', async ({ inventoryPage, cartPage }) => {
    // Added in an order that isn't name, price or id order, to pin that the cart keeps add order.
    const added = [fleeceJacket, onesie, backpack];
    for (const product of added) {
      await inventoryPage.addToCart(product.name);
    }

    await inventoryPage.header.openCart();

    await expect(cartPage.itemNames).toHaveText(added.map((p) => p.name));
    await expect(cartPage.itemPrices).toHaveText(added.map((p) => formatPrice(p.price)));
    await expect(cartPage.itemQuantities).toHaveText(['1', '1', '1']);
  });

  test('removes an item from the cart page @regression', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(backpack.name);
    await inventoryPage.addToCart(onesie.name);
    await inventoryPage.header.openCart();
    // Inventory cards have remove buttons too and can still be in the DOM, so wait for the cart first.
    await expect(cartPage.title).toHaveText('Your Cart');

    await cartPage.removeItem(backpack.name);

    await expect(cartPage.itemNames).toHaveText([onesie.name]);
    await expect(cartPage.header.cartBadge).toHaveText('1');
  });

  test('empties the cart when every item is removed @regression', async ({ inventoryPage, cartPage }) => {
    await inventoryPage.addToCart(backpack.name);
    await inventoryPage.addToCart(onesie.name);
    await inventoryPage.header.openCart();
    await expect(cartPage.title).toHaveText('Your Cart');

    await cartPage.removeItem(backpack.name);
    await cartPage.removeItem(onesie.name);

    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.header.cartBadge).toBeHidden();
  });

  test('returns to inventory with continue shopping @regression', async ({ page, inventoryPage, cartPage }) => {
    await inventoryPage.header.openCart();
    await expect(cartPage.title).toHaveText('Your Cart');

    await cartPage.continueShopping();

    await expect(page).toHaveURL('/inventory.html');
  });

  test('keeps items after a page reload @regression', async ({ inventoryPage, cartPage }) => {
    const added = [backpack, onesie];
    for (const product of added) {
      await inventoryPage.addToCart(product.name);
    }
    await inventoryPage.header.openCart();
    await expect(cartPage.itemNames).toHaveText(added.map((p) => p.name));

    await cartPage.reload();

    await expect(cartPage.itemNames).toHaveText(added.map((p) => p.name));
    await expect(cartPage.header.cartBadge).toHaveText('2');
  });

  test('keeps the badge when visiting a product and coming back @regression', async ({ inventoryPage, productDetailPage }) => {
    await inventoryPage.addToCart(backpack.name);

    await inventoryPage.openProduct(bikeLight.name);
    await expect(productDetailPage.name).toHaveText(bikeLight.name);
    await expect(productDetailPage.header.cartBadge).toHaveText('1');

    await productDetailPage.backToProducts();
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.header.cartBadge).toHaveText('1');
  });

  test('allows checkout with an empty cart @regression @negative', async ({ page, inventoryPage, cartPage }) => {
    await inventoryPage.header.openCart();
    await expect(cartPage.title).toHaveText('Your Cart');
    await expect(cartPage.items).toHaveCount(0);

    const checkoutInfoPage = await cartPage.checkout();

    // SauceDemo allows this. The test documents that behaviour rather than endorsing it.
    await expect(page).toHaveURL('/checkout-step-one.html');
    await expect(checkoutInfoPage.title).toHaveText('Checkout: Your Information');
  });
});
