import { test, expect } from '../fixtures/automationexercise.fixture';
import { blueTop, catalogue } from '../data/automationexercise.data';

test.describe('automationexercise products', () => {
  test.beforeEach(async ({ productsPage }) => {
    await productsPage.goto();
    await expect(productsPage.heading).toHaveText('All Products');
  });

  test('lists every product @smoke @regression', async ({ productsPage }) => {
    await expect(productsPage.cards).toHaveCount(catalogue.productCount);
  });

  test('finds products by search term @regression', async ({ productsPage }) => {
    await productsPage.search(catalogue.search.term);

    await expect(productsPage.heading).toHaveText('Searched Products');
    await expect(productsPage.cards).toHaveCount(catalogue.search.resultCount);
    for (const name of catalogue.search.includes) {
      await expect(productsPage.names.filter({ hasText: name }).first()).toBeVisible();
    }
  });

  test('shows no products for a search with no match @regression @negative', async ({ productsPage }) => {
    await productsPage.search(catalogue.noMatchTerm);

    await expect(productsPage.heading).toHaveText('Searched Products');
    await expect(productsPage.cards).toHaveCount(0);
  });
});

test.describe('automationexercise product detail', () => {
  test('shows the name, category, price and brand @regression', async ({ productDetailPage }) => {
    await productDetailPage.open(blueTop.id);

    await expect(productDetailPage.name).toHaveText(blueTop.name);
    await expect(productDetailPage.category).toHaveText(blueTop.category);
    await expect(productDetailPage.price).toHaveText(blueTop.price);
    await expect(productDetailPage.brand).toHaveText(blueTop.brand);
  });
});
