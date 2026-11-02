const { BasePage } = require('./BasePage');
const { HeaderComponent } = require('../components/HeaderComponent');
const { CheckoutInfoPage } = require('./CheckoutInfoPage');

class CartPage extends BasePage {
  constructor(page) {
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

  async removeItem(name) {
    await this.items.filter({ hasText: name }).locator(this.removeButtons).click();
  }

  async continueShopping() {
    await this.continueShoppingButton.click();
  }

  async checkout() {
    await this.checkoutButton.click();
    return new CheckoutInfoPage(this.page);
  }
}

module.exports = { CartPage };
