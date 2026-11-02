import { test, expect } from '../fixtures/automationexercise.fixture';
import { unknownLogin } from '../data/automationexercise.data';

// Registration isn't tested: it would create a real account on someone else's site (see the Phase 11 plan).
test.describe('automationexercise login', () => {
  test('rejects an address with no account @regression @negative', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(unknownLogin.email, unknownLogin.password);

    await expect(loginPage.errorMessage).toHaveText(unknownLogin.error);
    await expect(page).toHaveURL(/\/login$/);
  });
});
