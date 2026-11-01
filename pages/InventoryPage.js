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
  }

  async goto() {
    await super.goto('/inventory.html');
  }

  async sortBy(label) {
    await this.sortDropdown.selectOption({ label });
  }
}

module.exports = { InventoryPage };
