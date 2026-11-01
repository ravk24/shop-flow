# ShopFlow Phase 6 — Checkout and E2E Journey: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (execution method already chosen: inline, then one fresh whole-branch review). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CHK-01 to CHK-13 and E2E-01 pass on Chromium, and `npm run test:smoke` runs AUTH-01, PROD-01, CART-01, CHK-01 and E2E-01 in under a minute.

**Architecture:** Three new page objects form a one-way chain: `cartPage.checkout()` returns `CheckoutInfoPage`, `continue()` returns `CheckoutOverviewPage`, `finish()` returns `CheckoutCompletePage`. Expected money values are computed in cents from `data/products.js`, never read back from the page. The E2E spec logs in through the UI and marks each stage with `test.step`.

**Tech Stack:** Playwright 1.64, JavaScript (CommonJS).

**Spec:** `PROJECT_PLAN.md` §5 (framework rules), §5.5 (data), §6.4 and §6.5 (scenarios), §8 Phase 6, §9 (conventions).

**Verified SauceDemo behaviour (recon on 2026-11-01):**

| Question | Observed | Consequence |
|---|---|---|
| Item total text, all 63 possible carts | 18 show a raw float, for example `Item total: $59.980000000000004` (Bike Light + Fleece Jacket) and `$57.980000000000004` (Onesie + Fleece Jacket) | **App bug.** An exact match can't work for every cart, and E2E-01's cart is affected. See Decisions 1 and 2 |
| Tax, all 63 carts | Always two decimals; equals `Math.round(cents * 0.08) / 100` with 0 mismatches | The spec's 8% formula holds when computed in cents |
| Total, all 63 carts | Always two decimals; equals item total + tax in cents with 0 mismatches | CHK-05 can be exact |
| Step one test ids | `title`, `firstName`, `lastName`, `postalCode`, `continue`, `cancel`, `error` | Title is `Checkout: Your Information` |
| Blank fields | `Error: First Name is required`, `Error: Last Name is required`, `Error: Postal Code is required`; all blank shows First Name; URL stays on step one | CHK-09 to CHK-12 |
| Whitespace-only fields | Accepted; goes to step two | Not a planned scenario, so it's recorded in `CLAUDE.md` only |
| Overview test ids | `title`, `inventory-item`, `item-quantity`, `inventory-item-name`, `inventory-item-price`, `subtotal-label`, `tax-label`, `total-label`, `cancel`, `finish` | Title is `Checkout: Overview`. **`cancel` is also on step one** |
| Cancel from step one | `/cart.html`, items and badge intact | CHK-06 |
| Cancel from overview | `/inventory.html`, badge intact, `cart-contents` unchanged | CHK-07 |
| Complete page | `/checkout-complete.html`, title `Checkout: Complete!`, `complete-header` is `Thank you for your order!`, `back-to-products` is `Back Home`; `cart-contents` removed | CHK-01. `back-to-products` is also on the detail page, but not reachable in this flow |
| Back Home | `/inventory.html`, no badge, every card shows Add to cart | CHK-08 |
| Empty cart, direct `/checkout-step-two.html` | Loads with no redirect or error, 0 rows, `Item total: $0`, `Tax: $0.00`, `Total: $0.00`; Finish present and leads to `Thank you for your order!` | CHK-13 asserts this |
| Logged out, `/checkout-step-two.html` | Redirected to `/` with `Epic sadface: You can only access '/checkout-step-two.html' when you are logged in.` | Stale state fails loudly |

## Global Constraints

- JavaScript (CommonJS). Page objects never contain `expect`.
- Locators are defined once in constructors. Methods contain no new test ids or selectors.
- Specs import `test` and `expect` only from `fixtures/pages.fixture.js`, with no `new XPage` and no `page.getBy…`.
- No product strings, prices or customer data in specs; they come from `data/`.
- Web-first assertions and no `waitForTimeout`. The one exception is reading money labels with `textContent()`, because the value must be rounded before comparing and `toHaveText` can't do that. The labels exist only on the overview, and `textContent()` waits for them.
- `test.fail()` is the first line of a test body. Preconditions go in `beforeEach`, where failure stays red, and nothing that can throw for another reason goes in the body.
- Tags: every test has `@regression`; CHK-01 and E2E-01 add `@smoke`; CHK-09 to CHK-14 add `@negative`.
- Titles: plain English, present tense, lowercase start, tags last, no scenario ids.
- Config stays Chromium-only until Phase 7.
- Branch `phase-6-checkout`. Imperative commits ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `CLAUDE.md` stays out of commits.
- Read each test run's own exit code (`; echo "exit=$?"`), never a `grep`'s. Use the Edit tool for lines containing regexes. Confirm temporary mutations are reverted.

## Decisions Needing Approval

1. **Add one scenario, CHK-14, for the item total bug.** It isn't in §6.4. It asserts the correct text, `Item total: $59.98`, under `test.fail()`, so the bug is tracked and the run goes red if it's fixed. The scenario total goes from 43 to 44, and §6.4 and the coverage table are updated. Unlike `problem_user`, this bug affects the normal `standard_user`, so it's the strongest "bug I found" story for §11 point 7. I can't tell whether it's deliberate on SauceDemo's part.
2. **Money assertions round the displayed amount to cents before comparing.** E2E-01's cart hits the bug, so exact text would fail. `parseLabelAmount` rounds `$57.980000000000004` to `57.98`. The rounding could only hide an error smaller than half a cent, and CHK-14 keeps the display bug visible.
3. **Rule 6 applies to forward steps only.** `checkout()`, `continue()` and `finish()` return the next page. `cancel()` and `backHome()` return nothing and tests use fixtures, matching the §5.1 note from Phase 5, because `CheckoutInfoPage.cancel()` returning `CartPage` would be a circular `require`.
4. **CHK-12 joins the data-driven loop.** §8 task 4 says CHK-09 to CHK-12 while §6.4 says CHK-09 to CHK-11. They differ only in which fields are blank, so I'm following §8. §6.4's note is corrected.

## Review Focus

1. **CHK-14 passing for the wrong reason.** Pinned by keeping arrangement in `beforeEach`, computing the expected text at module level, reading the actual error message, and swapping to a clean cart, which must report `Expected to fail, but passed.` (Task 3 Steps 4 and 5).
2. **Money assertions that can't fail.** Expected values reading from the page would be circular, and rounding could hide errors. Pinned by computing from `data/products.js` and by a tax-rate mutation (Task 2 Step 4).
3. **Clicking the wrong `cancel`.** Step one and the overview share the test id, and old content can stay in the DOM briefly. Step one's cancel leads to the cart rather than inventory. Pinned by CHK-07 asserting the overview title before cancelling.
4. **CHK-13 not really starting empty, or cart state leaking between parallel tests.** Pinned by asserting 0 rows, by `--repeat-each=3` (Task 3 Step 7) and by checking `.auth/standard.json` has no `cart-contents` (Task 5 Step 2).
5. **E2E-01 passing without doing what it claims.** The sort could be skipped, or a saved login could mask a broken login. Pinned by the logged-out opt-out, by asserting the first and last cards after sorting, and by a mutation that removes the sort (Task 4 Step 4).

---

## File Structure (end of Phase 6)

```
data/checkout.data.js                 # NEW: validCustomer, invalidCustomers
utils/price.js                        # + orderTotals, parseLabelAmount
pages/CheckoutInfoPage.js             # NEW
pages/CheckoutOverviewPage.js         # NEW
pages/CheckoutCompletePage.js         # NEW
pages/CartPage.js                     # checkout() returns CheckoutInfoPage
fixtures/pages.fixture.js             # + checkoutOverviewPage
tests/checkout/checkout.helpers.js    # NEW: startCheckout, reachOverview
tests/checkout/checkout.positive.spec.js # NEW: CHK-01 to 08
tests/checkout/checkout.negative.spec.js # NEW: CHK-09 to 14
tests/cart/cart.spec.js               # CART-10 uses CheckoutInfoPage
tests/e2e/purchase-journey.spec.js    # NEW: E2E-01
README.md, PROJECT_PLAN.md            # bug note, status, CHK-14
```

---

### Task 1: Checkout pages and the positive flow

**Files:**
- Create: `data/checkout.data.js`, `pages/CheckoutInfoPage.js`, `pages/CheckoutOverviewPage.js`, `pages/CheckoutCompletePage.js`, `tests/checkout/checkout.helpers.js`, `tests/checkout/checkout.positive.spec.js`
- Modify: `pages/CartPage.js`, `tests/cart/cart.spec.js`
- Add: this plan

**Interfaces:**
- Produces `validCustomer: { firstName, lastName, postalCode }` from `data/checkout.data.js`.
- Produces `CheckoutInfoPage`: `title`, `firstName`, `lastName`, `postalCode`, `continueButton`, `cancelButton`, `errorMessage`, plus `fillCustomer({ firstName, lastName, postalCode })`, `continue(): Promise<CheckoutOverviewPage>`, `cancel()`.
- Produces `CheckoutOverviewPage`: `title`, `items`, `itemNames`, `itemPrices`, `itemQuantities`, `subtotalLabel`, `taxLabel`, `totalLabel`, `finishButton`, `cancelButton`, plus `goto()` (`/checkout-step-two.html`), `finish(): Promise<CheckoutCompletePage>`, `cancel()`.
- Produces `CheckoutCompletePage`: `title`, `completeHeader`, `backHomeButton`, plus `backHome()`.
- Changes `CartPage.checkout()` to return `CheckoutInfoPage`.
- Produces from `checkout.helpers.js`: `startCheckout({ inventoryPage, cartPage }, items): Promise<CheckoutInfoPage>` (goes to inventory, adds each item by name, opens the cart, checks out) and `reachOverview(pages, items): Promise<CheckoutOverviewPage>` (also fills `validCustomer` and continues).

- [ ] **Step 1: Branch and baseline**

Run: `git switch -c phase-6-checkout`, then `npx playwright test; echo "exit=$?"`
Expected: 31 passed, `exit=0`.

- [ ] **Step 2: RED — write the helpers and the spec**

| Scenario | Title and tags | Arrange and act | Assertions |
|---|---|---|---|
| CHK-01 | `completes checkout with one item @smoke @regression` | `reachOverview` with backpack, `finish()` | URL `/checkout-complete.html`; `title` `Checkout: Complete!`; `completeHeader` `Thank you for your order!`; `backHomeButton` `Back Home` |
| CHK-02 | `lists the cart's items on the overview @regression` | `reachOverview` with fleece jacket, onesie, backpack | `title` `Checkout: Overview`; `itemNames` and `itemPrices` in that order; `itemQuantities` `['1','1','1']` |
| CHK-06 | `returns to the cart with items intact when cancelling step one @regression` | `startCheckout` with backpack and onesie, `cancel()` | URL `/cart.html`; `cartPage.itemNames` both names; badge `2` |
| CHK-07 | `returns to inventory with the cart intact when cancelling the overview @regression` | `reachOverview` with backpack and onesie; assert `title` is `Checkout: Overview`; `cancel()` | URL `/inventory.html`; `inventoryPage.title` `Products`; badge `2` |
| CHK-08 | `clears the cart after back home @regression` | `reachOverview` with backpack, `finish()`, `backHome()` | URL `/inventory.html`; `inventoryPage.title` `Products`; badge hidden; `inventoryPage.removeButtons` count `0` |

CHK-07's comment says `cancel` is on both steps, so wait for the overview first.

Run: `npx playwright test tests/checkout; echo "exit=$?"`
Expected: `exit=1`, all 5 fail because `checkout()` returns `undefined`.

- [ ] **Step 3: Implement the pages and `CartPage.checkout()`**

Run the Step 2 command.
Expected: 6 passed (setup plus 5), `exit=0`.

- [ ] **Step 4: Move CART-10 off `cartPage.title`**

In `tests/cart/cart.spec.js`, CART-10 becomes `const checkoutInfoPage = await cartPage.checkout();`, and its title assertion uses `checkoutInfoPage.title`.

Run: `npx playwright test tests/cart; echo "exit=$?"`
Expected: 11 passed, `exit=0`.

- [ ] **Step 5: Commit**

Message: `Add checkout pages and positive checkout tests`

---

### Task 2: Money calculations

**Files:**
- Modify: `utils/price.js`, `pages/CheckoutOverviewPage.js`, `tests/checkout/checkout.positive.spec.js`

**Interfaces:**
- Produces from `utils/price.js`:
  - `orderTotals(items: {price: number}[]): { subtotal, tax, total }`, all numbers. Works in integer cents: `cents` is the sum of `Math.round(price * 100)`, `taxCents` is `Math.round(cents * 0.08)`, and each result is divided by 100 once.
  - `parseLabelAmount(text: string): number`. Takes the amount after `$` in `Item total: $59.980000000000004`, `Tax: $3.20` or `Item total: $0`, and returns it rounded to cents. Throws if there's no amount. A comment explains the app's raw floats.
- Produces on `CheckoutOverviewPage`: `subtotal()`, `tax()`, `total()`, each `Promise<number>` via `parseLabelAmount(await label.textContent())`.

- [ ] **Step 1: RED — write the tests**

All three use a file-level `order = [backpack, bikeLight, onesie]` and `expected = orderTotals(order)`, and call `reachOverview` with `order`.

| Scenario | Title | Assertion |
|---|---|---|
| CHK-03 | `shows the item total as the sum of item prices @regression` | `expect(await overview.subtotal()).toBe(expected.subtotal)` |
| CHK-04 | `charges tax at 8 percent of the item total @regression` | `expect(await overview.tax()).toBe(expected.tax)` |
| CHK-05 | `shows the total as item total plus tax @regression` | `expect(await overview.total()).toBe(expected.total)` |

Run: `npx playwright test tests/checkout/checkout.positive.spec.js; echo "exit=$?"`
Expected: `exit=1`, failing on `orderTotals is not a function`, which stops the spec loading until Step 2.

- [ ] **Step 2: Implement `orderTotals`, `parseLabelAmount` and the three methods**

Run the Step 1 command.
Expected: 9 passed (setup plus 8), `exit=0`.

- [ ] **Step 3: Check the helpers against recon values**

Add a temporary test, or use a scratch script, to confirm:

| Input | Expected |
|---|---|
| `parseLabelAmount('Item total: $59.980000000000004')` | `59.98` |
| `parseLabelAmount('Item total: $0')` | `0` |
| `parseLabelAmount('Tax: nothing')` | throws |
| `orderTotals` for all six products | `{ subtotal: 129.94, tax: 10.4, total: 140.34 }` |
| `orderTotals` for Bike Light + Fleece Jacket | `{ subtotal: 59.98, tax: 4.8, total: 64.78 }` |

Don't commit the temporary check.

- [ ] **Step 4: Mutation — the tax rate must matter**

Temporarily change `0.08` to `0.07`. Run the Step 1 command.
Expected: `exit=1`, CHK-04 and CHK-05 fail and CHK-03 passes. Revert and confirm 9 passed.

- [ ] **Step 5: Commit**

Message: `Add order total calculations and checkout money tests`

---

### Task 3: Negative checkout tests

**Files:**
- Create: `tests/checkout/checkout.negative.spec.js`
- Modify: `data/checkout.data.js`, `fixtures/pages.fixture.js`

**Interfaces:**
- Produces `invalidCustomers` from `data/checkout.data.js`: an array of `{ name, customer, error }` with these errors: `Error: First Name is required`, `Error: Last Name is required`, `Error: Postal Code is required`, and for all blank, `Error: First Name is required`.
- Produces fixture `checkoutOverviewPage`.

- [ ] **Step 1: RED — write the spec**

| Scenario | Title and tags | Body |
|---|---|---|
| CHK-09 to 12 | `` `shows "${c.error}" for ${c.name} @regression @negative` `` in a `for…of` | `startCheckout` with backpack, `fillCustomer(c.customer)`, `continue()`. `errorMessage` matches; URL stays `/checkout-step-one.html` |
| CHK-13 | `allows direct navigation to the overview with an empty cart @regression @negative` | `checkoutOverviewPage.goto()`. URL stays `/checkout-step-two.html`; `items` count `0`; `subtotalLabel` `Item total: $0`, `taxLabel` `Tax: $0.00`, `totalLabel` `Total: $0.00`; `finishButton` visible. A comment notes that SauceDemo allows this, which lets you place an empty order, and that the test documents it rather than endorses it |

Run: `npx playwright test tests/checkout/checkout.negative.spec.js; echo "exit=$?"`
Expected: `exit=1`, failing on the missing `invalidCustomers` or `checkoutOverviewPage`.

- [ ] **Step 2: Add the data and the fixture**

Run the Step 1 command.
Expected: 6 passed (setup plus 5), `exit=0`.

- [ ] **Step 3: Add CHK-14**

A separate describe, `checkout - known bugs`:

```js
const floatCart = [products.bikeLight, products.fleeceJacket];
const correctSubtotal = `Item total: ${formatPrice(orderTotals(floatCart).subtotal)}`;

test.beforeEach(async ({ inventoryPage, cartPage }) => {
  const overview = await reachOverview({ inventoryPage, cartPage }, floatCart);
  await expect(overview.title).toHaveText('Checkout: Overview');
});

test('shows the item total rounded to cents @regression @negative', async ({ checkoutOverviewPage }) => {
  // Known bug: 18 of the 63 possible carts show a raw float, here $59.980000000000004.
  test.fail();

  await expect(checkoutOverviewPage.subtotalLabel).toHaveText(correctSubtotal);
});
```

Run: `npx playwright test tests/checkout/checkout.negative.spec.js; echo "exit=$?"`
Expected: 7 passed (setup plus 6), `exit=0`, with `✘` on CHK-14.

- [ ] **Step 4: Confirm it fails for the right reason**

Run with `--reporter=json` and read the output.
Expected for CHK-14: `expectedStatus: failed`, `status: failed`, `ok: true`, with the error showing expected `Item total: $59.98` and received `Item total: $59.980000000000004`.

- [ ] **Step 5: Prove the assertion passes on a clean cart**

Temporarily set `floatCart` to `[products.backpack, products.bikeLight]`. Run with `-g "rounded to cents"`.
Expected: `exit=1`, `Expected to fail, but passed.` Revert.

- [ ] **Step 6: Prove a broken precondition goes red**

Temporarily assert the wrong title in that `beforeEach`. Run with `-g "rounded to cents"`.
Expected: `exit=1`, failing on the title. Revert.

- [ ] **Step 7: Parallel stability**

Run: `npx playwright test tests/checkout tests/cart --repeat-each=3; echo "exit=$?"`
Expected: `exit=0`, with every test passing on all 3 repeats. Treat any intermittent failure as a bug, and don't add waits or retries.

- [ ] **Step 8: Commit**

Message: `Add negative checkout tests and record the item total bug`

---

### Task 4: End-to-end journey

**Files:**
- Create: `tests/e2e/purchase-journey.spec.js`

**Interfaces:**
- Consumes: the chain from Task 1; `orderTotals` from Task 2; `users.standard`; `validCustomer`.

- [ ] **Step 1: RED — write the spec, missing only the last stage**

Top level: `test.use({ storageState: { cookies: [], origins: [] } })`, with the usual comment. Cheapest and most expensive are computed from `allProducts` by price, not named.

Title: `completes a purchase from login to an empty cart @smoke @regression`. One `test.step` per stage:

| Step title | Actions | Assertions |
|---|---|---|
| `log in` | `loginPage.goto()`, `login(...)` | URL `/inventory.html`; title `Products` |
| `sort by price, low to high` | `sortBy('Price (low to high)')` | `itemNames.first()` is the cheapest; `itemNames.last()` is the most expensive |
| `add the cheapest and most expensive` | `addToCart` each | Badge `2` |
| `verify the cart` | `header.openCart()` | `cartPage.itemNames` and `itemPrices` match the two products, in add order |
| `enter customer details` | `checkout()`, `fillCustomer(validCustomer)`, `continue()` | Overview `title` |
| `verify the totals` | | `subtotal()`, `tax()` and `total()` equal `orderTotals` of the two products |
| `finish the order` | `finish()` | `completeHeader` is `Thank you for your order!` |

Omit `back home` for now, then temporarily assert the badge is `1` at the end of `finish the order`.

Run: `npx playwright test tests/e2e; echo "exit=$?"`
Expected: `exit=1`, failing inside `finish the order` on the temporary badge check. Remove it.

- [ ] **Step 2: Add the last stage**

| Step title | Actions | Assertions |
|---|---|---|
| `go back home with an empty cart` | `backHome()` | URL `/inventory.html`; title `Products`; badge hidden |

Run the Step 1 command.
Expected: 2 passed (setup plus 1), `exit=0`.

- [ ] **Step 3: Confirm the steps are recorded**

Run with `--reporter=json` and read the test's `results[0].steps`.
Expected: all 8 step titles above, in order.

- [ ] **Step 4: Mutation — the sort must matter**

Temporarily remove the `sortBy` call. Run the Step 1 command.
Expected: `exit=1`, failing inside `sort by price, low to high`. Revert.

- [ ] **Step 5: Commit**

Message: `Add end-to-end purchase journey`

---

### Task 5: Full verification and docs

**Files:**
- Modify: `README.md`, `PROJECT_PLAN.md`, `CLAUDE.md` (local handoff file, stays untracked)

- [ ] **Step 1: Filtered runs from a clean state**

Before each, run `rm -rf .auth`.

| Command | Expected |
|---|---|
| `npm run test:smoke; echo "exit=$?"` | 6 passed (setup, AUTH-01, PROD-01, CART-01, CHK-01, E2E-01), `exit=0`, under 60 s |
| `npm run test:negative; echo "exit=$?"` | 16 passed (setup plus 15), `exit=0` |
| `npm run test:regression; echo "exit=$?"` | 46 passed (setup plus 45), `exit=0` |
| `npm run test:chromium; echo "exit=$?"` | 46 passed, `exit=0` |

- [ ] **Step 2: Confirm the saved state stays clean**

Read `.auth/standard.json`.
Expected: a `session-username` cookie and no `cart-contents`.

- [ ] **Step 3: Check expected failures and record the duration**

Run: `npx playwright test --reporter=json` with output sent to the scratchpad, then read it.
Expected: `stats.unexpected` is 0, and exactly PROD-09, PROD-10 and CHK-14 have `expectedStatus: failed`. Record the total duration against the 10-minute cookie limit.

- [ ] **Step 4: Check the framework rules**

Run the Grep tool in `tests/` for `new [A-Z]\w+Page|@playwright/test|page\.getBy|waitForTimeout`.
Expected: no matches. Also search `tests/checkout` and `tests/e2e` for `Sauce Labs` and `\$\d`.
Expected: the only `$` amounts are CHK-13's `$0` and `$0.00` labels and the bug comment in CHK-14. A rule exception for those is acceptable because they document app behaviour rather than product data.

- [ ] **Step 5: Update docs**

- `README.md`: in "Known app bugs", add the item total bug and change "Two tests" to three, noting it affects `standard_user`. Add `tests/e2e` as the quickest full health check under "Run".
- `PROJECT_PLAN.md`: status line becomes `Phases 1 to 6 complete, Phase 7 next`. §6.4 gains the CHK-14 row (`N`, `Item total shows a raw float for some carts`, `test.fail: known bug`) and its note says CHK-09 to CHK-12 are one data-driven test. The coverage table's Checkout row becomes 8, 6, 14 and the total becomes 29, 15, 44. §10's "All 43 scenarios" becomes 44. §11 point 7 mentions the item total bug.
- `CLAUDE.md`: update status, commit hash and test counts. Add the recon facts (raw floats in 18 of 63 carts, tax formula, shared `cancel`, whitespace-only fields accepted, empty orders possible). Remove the Phase 5 deferred note about CART-10, since Task 1 resolves it.

- [ ] **Step 6: Run the suite once more**

Run: `npx playwright test; echo "exit=$?"`
Expected: 46 passed, `exit=0`.

- [ ] **Step 7: Commit**

Stage `README.md` and `PROJECT_PLAN.md` only.
Message: `Document the item total bug and record Phase 6 completion`

---

## Finish

1. Run one fresh whole-branch review and resolve its findings.
2. Merge to `main` with `--no-ff` as `Merge phase-6-checkout`, push `main` and the branch, and confirm CI is green on `main`.
3. Explain the concepts in plain words: `test.step` and how it appears in the HTML report, floating-point rounding in money assertions, and chaining page objects across a multi-page flow.
