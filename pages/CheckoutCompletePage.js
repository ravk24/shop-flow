const { BasePage } = require('./BasePage');

class CheckoutCompletePage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.getByTestId('title');
    this.completeHeader = page.getByTestId('complete-header');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  async backHome() {
    await this.backHomeButton.click();
  }
}

module.exports = { CheckoutCompletePage };
