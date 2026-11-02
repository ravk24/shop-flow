import type { Locator, Page } from '@playwright/test';
import { AutomationExercisePage } from './AutomationExercisePage';

export class AeProductDetailPage extends AutomationExercisePage {
  readonly name: Locator;
  readonly category: Locator;
  readonly price: Locator;
  readonly brand: Locator;
  readonly quantity: Locator;
  readonly addToCartButton: Locator;
  readonly addedModal: Locator;
  readonly addedTitle: Locator;
  readonly viewCartLink: Locator;

  constructor(page: Page) {
    super(page);
    const info = page.locator('.product-information');
    this.name = info.locator('h2');
    this.category = info.locator('p', { hasText: 'Category:' });
    this.price = info.locator('span > span');
    this.brand = info.locator('p', { hasText: 'Brand:' });
    this.quantity = info.locator('#quantity');
    this.addToCartButton = info.getByRole('button', { name: 'Add to cart' });
    // The modal (title included) is always in the DOM, hidden; it shows once the server has added the item.
    // Wait for `addedModal` to be visible; a text assertion on `addedTitle` alone passes at once.
    this.addedModal = page.locator('#cartModal');
    this.addedTitle = this.addedModal.locator('.modal-title');
    this.viewCartLink = this.addedModal.getByRole('link', { name: 'View Cart' });
  }

  async open(productId: number): Promise<void> {
    await this.goto(`/product_details/${productId}`);
  }

  // Returns once the click is sent. The item is only in the cart when `addedModal` is visible,
  // so a test must assert that before navigating away.
  async addToCart(quantity: number): Promise<void> {
    await this.quantity.fill(String(quantity));
    await this.addToCartButton.click();
  }

  // Waits for the cart page's load event: the cart's delete links do nothing until its script has run.
  async viewCart(): Promise<void> {
    await this.viewCartLink.click();
    await this.page.waitForURL('**/view_cart');
  }
}
