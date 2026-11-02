import { BasePage } from '../BasePage';

// automationexercise.com sometimes answers 503 "This website is under heavy load (queue full)".
// Failing here names that cause, instead of a locator timing out on an error page later.
export class AutomationExercisePage extends BasePage {
  override async goto(path: string): Promise<void> {
    const response = await this.page.goto(path);
    const status = response?.status() ?? 0;
    if (status >= 500) {
      throw new Error(
        `automationexercise.com answered ${status} for ${path}: the site is overloaded or down, not a test failure in itself.`,
      );
    }
  }
}
