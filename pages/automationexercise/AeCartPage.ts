import type { Locator, Page } from '@playwright/test';
import { AutomationExercisePage } from './AutomationExercisePage';

export class AeCartPage extends AutomationExercisePage {
  readonly rows: Locator;
  readonly emptyMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.rows = page.locator('#cart_info_table tbody tr');
    // Always in the DOM, hidden while the cart has items: assert it's visible, not just its text.
    this.emptyMessage = page.locator('#empty_cart');
  }

  override async goto(): Promise<void> {
    await super.goto('/view_cart');
  }

  // Rows are `tr#product-<id>`.
  row(productId: number): Locator {
    return this.page.locator(`#product-${productId}`);
  }

  quantityOf(productId: number): Locator {
    return this.row(productId).locator('.cart_quantity');
  }

  totalOf(productId: number): Locator {
    return this.row(productId).locator('.cart_total_price');
  }

  async remove(productId: number): Promise<void> {
    await this.row(productId).locator('.cart_quantity_delete').click();
  }
}
