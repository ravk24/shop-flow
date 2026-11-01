const { validCustomer } = require('../../data/checkout.data');

// Arrangement only, with no assertions: each test states what it expects of the page it lands on.
async function startCheckout({ inventoryPage, cartPage }, items) {
  await inventoryPage.goto();
  for (const item of items) {
    await inventoryPage.addToCart(item.name);
  }
  await inventoryPage.header.openCart();
  return cartPage.checkout();
}

async function reachOverview(pages, items) {
  const checkoutInfoPage = await startCheckout(pages, items);
  await checkoutInfoPage.fillCustomer(validCustomer);
  return checkoutInfoPage.continue();
}

module.exports = { startCheckout, reachOverview };
