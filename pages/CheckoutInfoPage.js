const { test } = require('@playwright/test');
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
    await this.fillField(this.firstName, firstName);
    await this.fillField(this.lastName, lastName);
    await this.fillField(this.postalCode, postalCode);
  }

  // On WebKit under load, fill() can succeed with no text arriving. A value still wrong after the refill fails the test's own assertions.
  // Each refill is recorded as a `refill` annotation on the test, so the HTML report shows how often it happens.
  async fillField(field, value) {
    await field.fill(value);
    if ((await field.inputValue()) !== value) {
      const description = `${field} had "${await field.inputValue()}" after fill`;
      // test.info() throws outside a running test; a refill must never fail for want of a place to record it.
      try {
        test.info().annotations.push({ type: 'refill', description });
      } catch {
        // Not inside a test: nothing to annotate.
      }
      await field.fill(value);
    }
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
