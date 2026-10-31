const { BasePage } = require('./BasePage');

class InventoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.getByTestId('title');
    this.sortDropdown = page.getByTestId('product-sort-container');
    this.items = page.getByTestId('inventory-item');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.itemImages = this.items.getByRole('img');
    this.addToCartButtons = page.getByTestId(/^add-to-cart-/);
  }

  async goto() {
    await super.goto('/inventory.html');
  }
}

module.exports = { InventoryPage };
