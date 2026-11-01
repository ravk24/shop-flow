const { BasePage } = require('./BasePage');
const { HeaderComponent } = require('../components/HeaderComponent');

class ProductDetailPage extends BasePage {
  constructor(page) {
    super(page);
    this.header = new HeaderComponent(page);
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.removeButton = page.getByTestId('remove');
    // Name, description and price share test ids with inventory cards, which can still be in the
    // DOM right after clicking a product. That would be a strict mode error, which isn't retried.
    // Only the detail card has a button with these exact test ids, so scope to it.
    this.card = page.getByTestId('inventory-item').filter({ has: this.addToCartButton.or(this.removeButton) });
    this.name = this.card.getByTestId('inventory-item-name');
    this.description = this.card.getByTestId('inventory-item-desc');
    this.price = this.card.getByTestId('inventory-item-price');
    this.backButton = page.getByTestId('back-to-products');
  }

  async addToCart() {
    await this.addToCartButton.click();
  }

  async backToProducts() {
    await this.backButton.click();
  }
}

module.exports = { ProductDetailPage };
