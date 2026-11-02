import type { Locator, Page } from '@playwright/test';
import { AutomationExercisePage } from './AutomationExercisePage';

export class AeLoginPage extends AutomationExercisePage {
  readonly email: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    // This app's config sets testIdAttribute to data-qa, which only its forms carry.
    this.email = page.getByTestId('login-email');
    this.password = page.getByTestId('login-password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.locator('form[action="/login"] p');
  }

  override async goto(): Promise<void> {
    await super.goto('/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.loginButton.click();
  }
}
