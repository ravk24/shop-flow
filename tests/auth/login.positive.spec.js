// tests/auth/login.positive.spec.js
const { test, expect } = require('@playwright/test');

// Phase 1 only: raw locators and env reads live in the spec.
// Phase 2 moves locators to page objects; Phase 3 moves credentials to data/users.js.
const username = process.env.STANDARD_USER || 'standard_user';
const password = process.env.PASSWORD || 'secret_sauce';

test.describe('login', () => {
  test('logs in as standard_user and lands on inventory @smoke', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('username').fill(username);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('login-button').click();

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.getByTestId('title')).toHaveText('Products');
  });
});
