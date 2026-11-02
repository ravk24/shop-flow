import { test, expect } from '../fixtures/automationexercise.fixture';
import { blueTop } from '../data/automationexercise.data';

// The cart lives on the server, keyed on a session cookie, so each test's fresh browser context starts empty.
test.describe('automationexercise cart', () => {
  test('starts empty for a new visitor @regression', async ({ cartPage }) => {
    await cartPage.goto();

    await expect(cartPage.emptyMessage).toBeVisible();
    await expect(cartPage.emptyMessage).toContainText('Cart is empty!');
    await expect(cartPage.rows).toHaveCount(0);
  });

  test.describe('with Blue Top added', () => {
    test.beforeEach(async ({ productDetailPage, cartPage, page }) => {
      await productDetailPage.open(blueTop.id);
      await productDetailPage.addToCart(3);
      // The item is in the cart only once the confirmation shows; leaving earlier loses it.
      await expect(productDetailPage.addedTitle).toHaveText('Added!');
      await productDetailPage.viewCart();
      await expect(page).toHaveURL(/\/view_cart$/);
      await expect(cartPage.rows).toHaveCount(1);
    });

    test('shows the quantity and line total from the detail page @smoke @regression', async ({ cartPage }) => {
      await expect(cartPage.row(blueTop.id)).toContainText(blueTop.name);
      await expect(cartPage.quantityOf(blueTop.id)).toHaveText('3');
      await expect(cartPage.totalOf(blueTop.id)).toHaveText('Rs. 1500');
    });

    test('is empty after removing the only item @regression', async ({ cartPage }) => {
      await cartPage.remove(blueTop.id);

      await expect(cartPage.emptyMessage).toBeVisible();
      await expect(cartPage.emptyMessage).toContainText('Cart is empty!');
      await expect(cartPage.rows).toHaveCount(0);
    });
  });
});
