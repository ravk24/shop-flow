const { test, expect } = require('../../fixtures/pages.fixture');
const { allProducts } = require('../../data/products');
const { parsePrice, formatPrice } = require('../../utils/price');

const byName = (a, b) => a.localeCompare(b);
const byPrice = (a, b) => parsePrice(a) - parsePrice(b);

const sortCases = [
  // A-Z is the default order, so start elsewhere or a broken A-Z would still pass.
  { title: 'sorts names from A to Z', option: 'Name (A to Z)', startFrom: 'Name (Z to A)', column: 'itemNames', compare: byName },
  { title: 'sorts names from Z to A', option: 'Name (Z to A)', column: 'itemNames', compare: (a, b) => byName(b, a) },
  { title: 'sorts prices from low to high', option: 'Price (low to high)', column: 'itemPrices', compare: byPrice },
  { title: 'sorts prices from high to low', option: 'Price (high to low)', column: 'itemPrices', compare: (a, b) => byPrice(b, a) },
];

async function expectSortToWork(inventoryPage, { option, startFrom, column, compare }) {
  if (startFrom) await inventoryPage.sortBy(startFrom);
  const expected = (await inventoryPage[column].allTextContents()).sort(compare);
  await inventoryPage.sortBy(option);
  await expect(inventoryPage[column]).toHaveText(expected);
}

test.describe('inventory', () => {
  test.beforeEach(async ({ inventoryPage }) => {
    await inventoryPage.goto();
  });

  test('lists all six products with name, price, image and button @smoke @regression', async ({ inventoryPage }) => {
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
    await expect(inventoryPage.itemNames).toHaveText(allProducts.map((p) => p.name));
    await expect(inventoryPage.itemPrices).toHaveText(allProducts.map((p) => formatPrice(p.price)));
    await expect(inventoryPage.itemImages).toHaveCount(allProducts.length);
    await expect(inventoryPage.addToCartButtons).toHaveText(Array(allProducts.length).fill('Add to cart'));
  });

  test('shows an empty cart in the header @regression', async ({ inventoryPage }) => {
    await expect(inventoryPage.header.cartLink).toBeVisible();
    await expect(inventoryPage.header.cartBadge).toBeHidden();
    await inventoryPage.header.openMenu();
    await expect(inventoryPage.header.logoutLink).toBeVisible();
  });

  for (const sortCase of sortCases) {
    test(`${sortCase.title} @regression`, async ({ inventoryPage }) => {
      // allTextContents() doesn't wait, so make sure the cards have rendered first.
      await expect(inventoryPage.items).toHaveCount(allProducts.length);

      await expectSortToWork(inventoryPage, sortCase);
    });
  }
});
