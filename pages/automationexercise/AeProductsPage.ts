import type { Locator, Page } from '@playwright/test';
import { AutomationExercisePage } from './AutomationExercisePage';

export class AeProductsPage extends AutomationExercisePage {
  readonly heading: Locator;
  readonly cards: Locator;
  readonly names: Locator;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    super(page);
    const results = page.locator('.features_items');
    // The heading says ALL PRODUCTS or SEARCHED PRODUCTS; both pages share every locator here,
    // so read results only after a retrying assertion on the heading.
    this.heading = results.locator('h2.title');
    this.cards = results.locator('.product-image-wrapper');
    this.names = results.locator('.productinfo p');
    this.searchInput = page.locator('#search_product');
    this.searchButton = page.locator('#submit_search');
  }

  override async goto(): Promise<void> {
    await super.goto('/products');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }
}
