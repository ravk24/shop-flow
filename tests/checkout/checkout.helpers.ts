import { validCustomer } from '../../data/checkout.data';
import type { Product } from '../../data/products';
import type { InventoryPage } from '../../pages/InventoryPage';
import type { CartPage } from '../../pages/CartPage';
import type { CheckoutInfoPage } from '../../pages/CheckoutInfoPage';
import type { CheckoutOverviewPage } from '../../pages/CheckoutOverviewPage';

interface CheckoutPages {
  inventoryPage: InventoryPage;
  cartPage: CartPage;
}

// Arrangement only, with no assertions: each test states what it expects of the page it lands on.
async function startCheckout({ inventoryPage, cartPage }: CheckoutPages, items: Product[]): Promise<CheckoutInfoPage> {
  await inventoryPage.goto();
  for (const item of items) {
    await inventoryPage.addToCart(item.name);
  }
  await inventoryPage.header.openCart();
  return cartPage.checkout();
}

async function reachOverview(pages: CheckoutPages, items: Product[]): Promise<CheckoutOverviewPage> {
  const checkoutInfoPage = await startCheckout(pages, items);
  await checkoutInfoPage.fillCustomer(validCustomer);
  return checkoutInfoPage.continue();
}

export { startCheckout, reachOverview };
