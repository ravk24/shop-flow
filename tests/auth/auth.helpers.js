const { expect } = require('../../fixtures/pages.fixture');

// The login page renders even for a logged-in user, so login tests can't tell on their own that they started
// logged out. Both login specs call this in beforeEach.
async function expectLoggedOut(context) {
  expect(await context.cookies()).toEqual([]);
}

module.exports = { expectLoggedOut };
