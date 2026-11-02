import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '../components/HeaderComponent';
import { CheckoutInfoPage } from './CheckoutInfoPage';

export class CartPage extends BasePage {
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemQuantities: Locator;
  readonly removeButtons: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    // These test ids are shared with the inventory page. Right after clicking into the cart,
    // inventory cards can still be in the DOM, so only read rows through retrying assertions.
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemQuantities = page.getByTestId('item-quantity');
    this.removeButtons = page.getByTestId(/^remove-/);
    this.continueShoppingButton = page.getByTestId('continue-shopping');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async removeItem(name: string): Promise<void> {
    await this.items.filter({ hasText: name }).locator(this.removeButtons).click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async checkout(): Promise<CheckoutInfoPage> {
    await this.checkoutButton.click();
    return new CheckoutInfoPage(this.page);
  }
}
