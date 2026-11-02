import type { BrowserContext } from '@playwright/test';
import { expect } from '../../fixtures/pages.fixture';

// The login page renders even for a logged-in user, so login tests can't tell on their own that they started
// logged out. Both login specs call this in beforeEach.
async function expectLoggedOut(context: BrowserContext): Promise<void> {
  expect(await context.cookies()).toEqual([]);
}

export { expectLoggedOut };
