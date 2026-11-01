const { BasePage } = require('./BasePage');
const { CheckoutOverviewPage } = require('./CheckoutOverviewPage');

class CheckoutInfoPage extends BasePage {
  constructor(page) {
    super(page);
    this.title = page.getByTestId('title');
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    // The overview has a cancel button too, with a different destination.
    this.cancelButton = page.getByTestId('cancel');
    this.errorMessage = page.getByTestId('error');
  }

  async fillCustomer({ firstName, lastName, postalCode }) {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.postalCode.fill(postalCode);
  }

  async continue() {
    await this.continueButton.click();
    return new CheckoutOverviewPage(this.page);
  }

  async cancel() {
    await this.cancelButton.click();
  }
}

module.exports = { CheckoutInfoPage };
