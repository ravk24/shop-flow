const { BasePage } = require('./BasePage');
const { CheckoutCompletePage } = require('./CheckoutCompletePage');

class CheckoutOverviewPage extends BasePage {
  constructor(page) {
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

  async goto() {
    await super.goto('/checkout-step-two.html');
  }

  async finish() {
    await this.finishButton.click();
    return new CheckoutCompletePage(this.page);
  }

  async cancel() {
    await this.cancelButton.click();
  }
}

module.exports = { CheckoutOverviewPage };
