const { BasePage } = require('./BasePage');

class InventoryPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.getByTestId('title');
  }

  async goto() {
    await super.goto('/inventory.html');
  }
}

module.exports = { InventoryPage };
