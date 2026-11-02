import { test, expect } from '../../fixtures/pages.fixture';
import { products } from '../../data/products';
import { formatPrice } from '../../utils/price';

// Not the first card, so opening the wrong product can't pass by accident.
const product = products.fleeceJacket;

test.describe('product detail', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
    await inventoryPage.openProduct(product.name);
  });

  test('opens the detail page with the same name, description and price @regression', async ({ page, productDetailPage }) => {
    await expect(page).toHaveURL(`/inventory-item.html?id=${product.id}`);
    await expect(productDetailPage.name).toHaveText(product.name);
    await expect(productDetailPage.description).toHaveText(product.description);
    await expect(productDetailPage.price).toHaveText(formatPrice(product.price));
  });

  test('returns to inventory with back to products @regression', async ({ page, productDetailPage, inventoryPage }) => {
    await productDetailPage.backToProducts();

    await expect(page).toHaveURL('/inventory.html');
    await expect(inventoryPage.title).toHaveText('Products');
  });

  test('adds to the cart from the detail page @regression', async ({ productDetailPage }) => {
    await productDetailPage.addToCart();

    await expect(productDetailPage.header.cartBadge).toHaveText('1');
    await expect(productDetailPage.removeButton).toHaveText('Remove');
    await expect(productDetailPage.addToCartButton).toBeHidden();
  });
});
