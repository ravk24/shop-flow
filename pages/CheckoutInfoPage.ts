import { test, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutOverviewPage } from './CheckoutOverviewPage';
import type { Customer } from '../data/checkout.data';

export class CheckoutInfoPage extends BasePage {
  readonly title: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
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

  async fillCustomer({ firstName, lastName, postalCode }: Customer): Promise<void> {
    await this.fillField(this.firstName, firstName, 'first name');
    await this.fillField(this.lastName, lastName, 'last name');
    await this.fillField(this.postalCode, postalCode, 'postal code');
  }

  // On WebKit under load, fill() can succeed with no text arriving. A value still wrong after the refill fails the test's own assertions.
  // Each refill is recorded as a `refill` annotation on the test, so the HTML report shows how often it happens.
  async fillField(field: Pick<Locator, 'fill' | 'inputValue'>, value: string, label: string): Promise<void> {
    await field.fill(value);
    if ((await field.inputValue()) !== value) {
      const description = `${label} had "${await field.inputValue()}" after fill`;
      // test.info() throws outside a running test; a refill must never fail for want of a place to record it.
      try {
        test.info().annotations.push({ type: 'refill', description });
      } catch {
        // Not inside a test: nothing to annotate.
      }
      await field.fill(value);
    }
  }

  async continue(): Promise<CheckoutOverviewPage> {
    await this.continueButton.click();
    return new CheckoutOverviewPage(this.page);
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
