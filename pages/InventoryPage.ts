import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { HeaderComponent } from '../components/HeaderComponent';

export class InventoryPage extends BasePage {
  readonly header: HeaderComponent;
  readonly title: Locator;
  readonly sortDropdown: Locator;
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemImages: Locator;
  readonly addToCartButtons: Locator;
  readonly removeButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemImages = this.items.getByRole('img');
    this.addToCartButtons = page.getByTestId(/^add-to-cart-/);
    // A card's button changes test id from add-to-cart-* to remove-* once clicked.
    this.removeButtons = page.getByTestId(/^remove-/);
  }

  override async goto(): Promise<void> {
    await super.goto('/inventory.html');
  }

  itemCard(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  addToCartButtonFor(name: string): Locator {
    return this.itemCard(name).locator(this.addToCartButtons);
  }

  removeButtonFor(name: string): Locator {
    return this.itemCard(name).locator(this.removeButtons);
  }

  async addToCart(name: string): Promise<void> {
    await this.addToCartButtonFor(name).click();
  }

  async removeFromCart(name: string): Promise<void> {
    await this.removeButtonFor(name).click();
  }

  async openProduct(name: string): Promise<void> {
    await this.itemNames.filter({ hasText: name }).click();
  }

  async sortBy(label: string): Promise<void> {
    await this.sortDropdown.selectOption({ label });
  }

  // Doesn't wait for the images, so assert the cards have rendered before calling it.
  async imageSources(): Promise<(string | null)[]> {
    return this.itemImages.evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  }

  // Cards in one column share a left edge. Like imageSources, it reads whatever has rendered.
  async columnCount(): Promise<number> {
    const lefts = await this.items.evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().left)));
    return new Set(lefts).size;
  }
}
