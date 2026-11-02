import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutCompletePage } from './CheckoutCompletePage';
import { parseLabelAmount } from '../utils/price';

export class CheckoutOverviewPage extends BasePage {
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly subtotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByTestId('title');
    // These test ids are shared with the cart, so only read rows through retrying assertions.
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemQuantities = page.getByTestId('item-quantity');
    this.subtotalLabel = page.getByTestId('subtotal-label');
    this.taxLabel = page.getByTestId('tax-label');
    this.totalLabel = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    // Step one has a cancel button too, with a different destination.
    this.cancelButton = page.getByTestId('cancel');
  }

  override async goto(): Promise<void> {
    await super.goto('/checkout-step-two.html');
  }

  // textContent() can return null; an empty string makes parseLabelAmount throw with the label it got.
  async subtotal(): Promise<number> {
    return parseLabelAmount((await this.subtotalLabel.textContent()) ?? '');
  }

  async tax(): Promise<number> {
    return parseLabelAmount((await this.taxLabel.textContent()) ?? '');
  }

  async total(): Promise<number> {
    return parseLabelAmount((await this.totalLabel.textContent()) ?? '');
  }

  async finish(): Promise<CheckoutCompletePage> {
    await this.finishButton.click();
    return new CheckoutCompletePage(this.page);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
