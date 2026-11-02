const { test, expect } = require('../../fixtures/pages.fixture');
const { allProducts } = require('../../data/products');
const { users } = require('../../data/users');
const { parsePrice, formatPrice } = require('../../utils/price');

const byName = (a, b) => a.localeCompare(b);
const byPrice = (a, b) => parsePrice(a) - parsePrice(b);

// Named because the problem_user test reuses it. A lookup there could fail silently under test.fail.
const priceLowToHigh = { title: 'sorts prices from low to high', option: 'Price (low to high)', column: 'itemPrices', compare: byPrice };

const sortCases = [
  // A-Z is the default order, so start elsewhere or a broken A-Z would still pass.
  { title: 'sorts names from A to Z', option: 'Name (A to Z)', startFrom: 'Name (Z to A)', column: 'itemNames', compare: byName },
  { title: 'sorts names from Z to A', option: 'Name (Z to A)', column: 'itemNames', compare: (a, b) => byName(b, a) },
  priceLowToHigh,
  { title: 'sorts prices from high to low', option: 'Price (high to low)', column: 'itemPrices', compare: (a, b) => byPrice(b, a) },
];

async function expectSortToWork(inventoryPage, { option, startFrom, column, compare }) {
  if (startFrom) await inventoryPage.sortBy(startFrom);
  const expected = (await inventoryPage[column].allTextContents()).sort(compare);
  await inventoryPage.sortBy(option);
  await expect(inventoryPage[column]).toHaveText(expected);
}

test.describe('inventory', () => {
  test.beforeEach(async ({ page, inventoryPage }) => {
    await inventoryPage.goto();
    // Expired saved state redirects to login. Without this, that would surface as "expected 6 items, received 0".
    await expect(page, 'saved login state has expired; rerun without --no-deps').toHaveURL('/inventory.html');
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
  });

  test('opens the burger menu with a logout link @regression', async ({ inventoryPage }) => {
    await inventoryPage.header.openMenu();

    // toBeVisible would also pass with the menu closed: the link counts as visible while it sits off screen.
    await expect(inventoryPage.header.logoutLink).toBeInViewport();
  });

  for (const sortCase of sortCases) {
    test(`${sortCase.title} @regression`, async ({ inventoryPage }) => {
      // allTextContents() doesn't wait, so make sure the cards have rendered first.
      await expect(inventoryPage.items).toHaveCount(allProducts.length);

      await expectSortToWork(inventoryPage, sortCase);
    });
  }
});

test.describe('inventory - problem_user', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // Preconditions live here because a failure in beforeEach stays red.
  // Inside a test.fail body, a broken login would look the same as the known bug.
  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginPage.goto();
    await loginPage.login(users.problem.username, users.problem.password);
    await expect(inventoryPage.title).toHaveText('Products');
    await expect(inventoryPage.items).toHaveCount(allProducts.length);
  });

  test('sorts prices from low to high for problem_user @regression @negative', async ({ inventoryPage }) => {
    // Known bug: sorting does nothing for this user and the dropdown snaps back to A-Z.
    // This spends the full 5 s expect timeout on every run, waiting for an order that never comes. That's expected.
    test.fail();

    await expectSortToWork(inventoryPage, priceLowToHigh);
  });

  test('shows a different image for each product for problem_user @regression @negative', async ({ inventoryPage }) => {
    // Known bug: every product image has the same src, a broken sl-404 file.
    test.fail();

    expect(new Set(await inventoryPage.imageSources()).size).toBe(allProducts.length);
  });
});
