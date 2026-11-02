const { BasePage } = require('./BasePage');
const { HeaderComponent } = require('../components/HeaderComponent');

class InventoryPage extends BasePage {
  constructor(page) {
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

  async goto() {
    await super.goto('/inventory.html');
  }

  itemCard(name) {
    return this.items.filter({ hasText: name });
  }

  addToCartButtonFor(name) {
    return this.itemCard(name).locator(this.addToCartButtons);
  }

  removeButtonFor(name) {
    return this.itemCard(name).locator(this.removeButtons);
  }

  async addToCart(name) {
    await this.addToCartButtonFor(name).click();
  }

  async removeFromCart(name) {
    await this.removeButtonFor(name).click();
  }

  async openProduct(name) {
    await this.itemNames.filter({ hasText: name }).click();
  }

  async sortBy(label) {
    await this.sortDropdown.selectOption({ label });
  }

  // Doesn't wait for the images, so assert the cards have rendered before calling it.
  async imageSources() {
    return this.itemImages.evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  }

  // Cards in one column share a left edge. Like imageSources, it reads whatever has rendered.
  async columnCount() {
    const lefts = await this.items.evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().left)));
    return new Set(lefts).size;
  }
}

module.exports = { InventoryPage };
