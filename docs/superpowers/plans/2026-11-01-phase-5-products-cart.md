# ShopFlow Phase 5 — Products and Cart: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (execution method already chosen: inline, then one fresh whole-branch review). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PROD-02 to PROD-10 and CART-01 to CART-10 pass on Chromium, with PROD-09 and PROD-10 recorded as expected failures.

**Architecture:** `data/products.js` and `utils/price.js` supply expected values. `InventoryPage` gains sorting and per-product actions, `ProductDetailPage` and `CartPage` are new, and both are exposed as fixtures. Tests add items through the UI, so each starts from the empty cart in its own copy of the saved state.

**Tech Stack:** Playwright 1.64, JavaScript (CommonJS).

**Spec:** `PROJECT_PLAN.md` §5 (framework rules), §6.2 and §6.3 (scenarios), §8 Phase 5, §9 (conventions).

**Verified SauceDemo behaviour (recon on 2026-11-01):**

| Question | Observed | Consequence |
|---|---|---|
| Default sort | Already Name (A to Z) | PROD-02 passes even if A-Z is broken unless it first switches away |
| Sort options | Labels `Name (A to Z)`, `Name (Z to A)`, `Price (low to high)`, `Price (high to low)` | `sortBy(label)` selects by visible label |
| Price ties | Bolt T-Shirt and Red T-Shirt are both $15.99 | Price-sort tests compare prices only, never names |
| String sort of prices | `$15.99` sorts before `$7.99` | The comparator must use `parsePrice` |
| Test ids per page | `inventory-item`, `inventory-item-name`, `inventory-item-price` exist on inventory, detail and cart | The same ids work on each page, but see the next row |
| Rows read straight after clicking into the cart | `waitForURL` returned while 6 inventory cards were still in the DOM; `toHaveCount(0)` then settled at 0 | Never read rows without a retrying assertion first |
| Card text | No product's name appears inside another card's text | `filter({ hasText: name })` picks exactly one card |
| `card.locator(regexTestIdLocator)` | Resolves to the one button inside that card | Per-product buttons reuse the constructor locators |
| Button test ids | Inventory and cart: `add-to-cart-<slug>`, `remove-<slug>`. Detail: `add-to-cart`, `remove` | `getByTestId` with a string is an exact match, so detail ids don't match the inventory ones |
| Cart row order | Add order (checked with ids 4,3,2 and 2,4,0) | CART-04 can assert exact order |
| Cart storage | `cart-contents` in localStorage, for example `[4,3,2]`; `[]` when emptied | CART-08 reload persists it |
| Remove the last item | Badge element is removed from the DOM | `toBeHidden()` |
| Remove on the cart page | The row's `inventory-item` test id is gone; a hidden `.removed_cart_item` remains | Counting by test id is safe |
| Empty cart checkout | Button enabled, goes to `/checkout-step-one.html`, title `Checkout: Your Information`, no error | CART-10 asserts this |
| Product ids | Backpack 4, Bike Light 0, Bolt T-Shirt 1, Fleece Jacket 5, Onesie 2, Red T-Shirt 3 | Stored in `data/products.js` |
| `problem_user` sort | Any option is a no-op; the dropdown snaps back to `az`, no dialog or page error | PROD-09 fails on order |
| `problem_user` images | All 6 `src` values are the same `sl-404` file | PROD-10 fails with 1 distinct of 6 |

**How `test.fail` behaves (spike on 2026-11-01):**

| Case | List reporter | Summary and exit code | JSON |
|---|---|---|---|
| Failure in the body under `test.fail()` | `✘` | Counted under **passed**, exit 0 | `expectedStatus: failed`, `status: failed`, `ok: true` |
| Wrong reason, for example a typo'd locator in the body | `✘` | Same as above, so the mistake is **silent** | Same, but the error message differs |
| `beforeEach` fails, with `test.fail()` called in the body | `✘` | **Failed**, exit 1 | `ok: false` |
| Body passes under `test.fail()`, meaning the bug is fixed | `✓` | **Failed** with `Expected to fail, but passed.`, exit 1 | `ok: false` |

So preconditions go in `beforeEach`, where they fail loudly, and `test.fail()` is the first line of the test body. The Done-when is checked through JSON, because the terminal shows `✘` while counting these tests as passed.

## Global Constraints

- JavaScript (CommonJS). Page objects never contain `expect`.
- Locators are defined once in constructors. Methods may narrow them with parameters (`filter`, `.locator(this.x)`) but contain no new test ids or selectors.
- Specs import `test` and `expect` only from `fixtures/pages.fixture.js`, with no `new XPage` and no `page.getBy…`.
- No product strings or prices in specs; they come from `data/products.js`.
- Web-first assertions and no `waitForTimeout`. `allTextContents()` and `evaluateAll()` don't wait, so each needs a retrying assertion before it.
- Tags: every test has `@regression`; CART-01 adds `@smoke`; PROD-09, PROD-10 and CART-10 add `@negative`.
- Titles: plain English, present tense, lowercase start, tags last. No scenario ids in titles, matching existing specs.
- Config stays Chromium-only until Phase 7.
- Branch `phase-5-products-cart`. Imperative commits ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `CLAUDE.md` stays out of commits.
- Read each test run's own exit code (`; echo "exit=$?"`), never a `grep`'s. Use the Edit tool for lines containing regexes. Confirm temporary mutations are reverted with `git diff`.

## Decisions Needing Approval

1. **Actions return nothing rather than the next page (§5.1 rule 6).** Inventory, detail and cart link to each other in a loop, and `HeaderComponent.openCart()` returning `CartPage` would be a circular `require`, since `CartPage` composes the header. Tests get these pages from fixtures, as Phase 4 does. Rule 6 applies from Phase 6, where checkout is one-way. §5.1 gets a sentence saying so.
2. **CART-10 is done here.** §8 lists it in both Phase 5's goal and Phase 6's task 5. It needs only `CartPage.checkoutButton` plus URL and title assertions, so `CheckoutInfoPage` isn't required. Phase 6's task 5 is edited to drop it.
3. **PROD-01 gets stricter.** It checks exact names and prices from `data/products.js` instead of regexes, which also catches the data file drifting from the live site before Phase 6 computes totals from it. If SauceDemo changes a price, this smoke test goes red.
4. **`test.fail` "reported as expected failure" is defined by JSON.** The terminal shows `✘` and counts them under passed, and that can't be configured. Done means `expectedStatus: failed`, `status: failed`, `ok: true`, with the right error message. The README explains this.

## Review Focus

1. **`test.fail` passing for the wrong reason.** A typo'd locator looks identical to the bug. Pinned by `beforeEach` preconditions, by checking the actual error messages, and by flipping to `standard_user`, where both tests must report `Expected to fail, but passed.` (Task 2 Steps 3 and 4).
2. **Sort tests passing without proving anything.** A-Z is already the default, and `allTextContents()` can return `[]`, whose sorted copy equals itself. Pinned by `startFrom` on A-Z, the `toHaveCount` guard and two mutations (Task 1 Steps 5 and 6).
3. **Reading stale rows after navigation.** `inventory-item` is shared, so inventory cards can be read as cart rows. Pinned by using only retrying assertions on rows, including `toHaveCount(0)` in CART-10, and by `--repeat-each=3` (Task 4 Step 5).
4. **Acting on the wrong product.** Buttons change test id after a click, and links on cards have `role="button"`. Pinned by per-card locators, and by CART-03 asserting that the untouched product still shows Remove.
5. **Cart state leaking between parallel tests.** Pinned by `--repeat-each=3` and by checking `.auth/standard.json` has no `cart-contents` (Task 5 Step 2). The run must also stay well under the 10-minute cookie limit, so Task 5 records its duration.

---

## File Structure (end of Phase 5)

```
data/products.js                     # NEW: six products, name order
utils/price.js                       # NEW: parsePrice, formatPrice
pages/BasePage.js                    # + reload()
pages/InventoryPage.js               # + removeButtons, sortBy, per-product actions, imageSources
pages/ProductDetailPage.js           # NEW
pages/CartPage.js                    # NEW
components/HeaderComponent.js        # + openCart()
fixtures/pages.fixture.js            # + productDetailPage, cartPage
tests/products/inventory.spec.js     # PROD-01 tightened, PROD-02 to 05, problem_user block
tests/products/product-detail.spec.js # NEW: PROD-06 to 08
tests/cart/cart.spec.js              # NEW: CART-01 to 10
README.md                            # known app bugs and how they display
PROJECT_PLAN.md                      # status, rule 6 note, CART-10 ownership, CART-08 wording
```

---

### Task 1: Product data, price helpers and sorting

**Files:**
- Create: `data/products.js`, `utils/price.js`
- Modify: `pages/InventoryPage.js`, `tests/products/inventory.spec.js`
- Add: this plan

**Interfaces:**
- Produces from `data/products.js`: `products` with keys `backpack`, `bikeLight`, `boltTShirt`, `fleeceJacket`, `onesie`, `redTShirt`, each `{ id: number, name: string, price: number, description: string }`, plus `allProducts` (`Object.values(products)`, in A-Z name order).
- Produces from `utils/price.js`: `parsePrice(text: string): number` and `formatPrice(amount: number): string` (`29.99` to `'$29.99'`).
- Produces on `InventoryPage`: `sortBy(label: string)`.

- [ ] **Step 1: Branch and baseline**

Run: `git switch -c phase-5-products-cart`, then `npx playwright test; echo "exit=$?"`
Expected: 12 passed, `exit=0`.

- [ ] **Step 2: Add the data and helpers**

Copy names, prices, ids and descriptions from the recon output. Add a comment that the order is A-Z because PROD-01 relies on it.

`parsePrice` throws on anything not matching `/^\$(\d+\.\d{2})$/`, so a bad read can't become `NaN` inside a comparator.

- [ ] **Step 3: RED — tighten PROD-01 and write the sort tests**

In `inventory.spec.js`, remove `PRODUCT_COUNT`. PROD-01 uses `allProducts.length`, and asserts `itemNames` equal `allProducts.map(p => p.name)` and `itemPrices` equal `allProducts.map(p => formatPrice(p.price))`.

Add a table at file level, and a helper that Task 2 reuses:

```js
const byName = (a, b) => a.localeCompare(b);
const byPrice = (a, b) => parsePrice(a) - parsePrice(b);

const sortCases = [
  // A-Z is the default order, so start elsewhere or a broken A-Z would still pass.
  { title: 'sorts names from A to Z', option: 'Name (A to Z)', startFrom: 'Name (Z to A)', column: 'itemNames', compare: byName },
  { title: 'sorts names from Z to A', option: 'Name (Z to A)', column: 'itemNames', compare: (a, b) => byName(b, a) },
  { title: 'sorts prices from low to high', option: 'Price (low to high)', column: 'itemPrices', compare: byPrice },
  { title: 'sorts prices from high to low', option: 'Price (high to low)', column: 'itemPrices', compare: (a, b) => byPrice(b, a) },
];

async function expectSortToWork(inventoryPage, { option, startFrom, column, compare }) {
  if (startFrom) await inventoryPage.sortBy(startFrom);
  const expected = (await inventoryPage[column].allTextContents()).sort(compare);
  await inventoryPage.sortBy(option);
  await expect(inventoryPage[column]).toHaveText(expected);
}
```

Generate one `@regression` test per case with `for…of`. Each calls `expect(inventoryPage.items).toHaveCount(allProducts.length)` first, because `allTextContents()` doesn't wait.

Run: `npx playwright test tests/products/inventory.spec.js; echo "exit=$?"`
Expected: `exit=1`, the 4 sort tests fail with `sortBy is not a function`. PROD-01 and the header test pass.

- [ ] **Step 4: Implement `sortBy(label)` on `InventoryPage`**

Use `this.sortDropdown.selectOption({ label })`. Run the Step 3 command.
Expected: 7 passed (setup plus 6), `exit=0`.

- [ ] **Step 5: Mutation — A-Z must be able to fail**

Temporarily add `if (label === 'Name (A to Z)') return;` to `sortBy`. Run the Step 3 command.
Expected: `exit=1`, only `sorts names from A to Z` fails. Revert.

- [ ] **Step 6: Mutation — prices must sort as numbers**

Temporarily set `byPrice` to `byName`. Run the Step 3 command.
Expected: `exit=1`, both price tests fail. Revert, then confirm the Step 4 result again and that `git diff` shows no mutation.

- [ ] **Step 7: Commit**

Stage the four files above and this plan.
Message: `Add product data, price helpers and sorting tests`

---

### Task 2: `problem_user` known bugs

**Files:**
- Modify: `pages/InventoryPage.js`, `tests/products/inventory.spec.js`

**Interfaces:**
- Consumes: `expectSortToWork` and `sortCases` from Task 1; `users.problem`.
- Produces on `InventoryPage`: `imageSources(): Promise<string[]>`, using `this.itemImages.evaluateAll` to return each `src`.

- [ ] **Step 1: Write the block**

Add a second top-level describe, `inventory - problem_user`, with `test.use({ storageState: { cookies: [], origins: [] } })`.

Its `beforeEach` logs in as `users.problem`, then asserts the title is `Products` and `items` has `allProducts.length`. A comment says these live in `beforeEach` because a failure here must stay red, unlike one inside a `test.fail` body.

| Scenario | Title | Body after `test.fail();` |
|---|---|---|
| PROD-09 | `sorts prices from low to high for problem_user @regression @negative` | `await expectSortToWork(inventoryPage, <the low-to-high case>)` |
| PROD-10 | `shows a different image for each product for problem_user @regression @negative` | `expect(new Set(await inventoryPage.imageSources()).size).toBe(allProducts.length)` |

Each test gets a comment documenting the known bug: the sort is a no-op and the dropdown snaps back to A-Z; every image `src` is the same `sl-404` file. Look up the low-to-high case from `sortCases` by its `option` so it isn't copied.

- [ ] **Step 2: Run them**

Run: `npx playwright test tests/products/inventory.spec.js -g problem_user; echo "exit=$?"`
Expected: 3 passed (setup plus both), `exit=0`, with `✘` beside the two tests.

- [ ] **Step 3: Confirm they fail for the right reason**

Run with `--reporter=json` and write the output to the scratchpad. Read it.
Expected for both: `expectedStatus: failed`, `status: failed`, `ok: true`. PROD-09's error is `toHaveText` showing the unsorted prices. PROD-10's error is `Expected: 6`, `Received: 1`. Any other message means the test is broken, so stop.

- [ ] **Step 4: Prove the assertions pass on a healthy user**

Temporarily change the `beforeEach` login to `users.standard`. Run the Step 2 command.
Expected: `exit=1`, both tests report `Expected to fail, but passed.` Revert and confirm with `git diff`.

- [ ] **Step 5: Prove a broken precondition goes red**

Temporarily use a wrong password in the `beforeEach` login. Run the Step 2 command.
Expected: `exit=1`, both tests fail on the title assertion. Revert, re-run the Step 2 command and confirm `exit=0`.

- [ ] **Step 6: Commit**

Message: `Record problem_user sort and image bugs as expected failures`

---

### Task 3: Product detail page

**Files:**
- Create: `pages/ProductDetailPage.js`, `tests/products/product-detail.spec.js`
- Modify: `pages/InventoryPage.js`, `fixtures/pages.fixture.js`

**Interfaces:**
- Produces `ProductDetailPage` with `header`, `name` (`inventory-item-name`), `description` (`inventory-item-desc`), `price` (`inventory-item-price`), `addToCartButton` (`add-to-cart`), `removeButton` (`remove`), `backButton` (`back-to-products`), plus `addToCart()` and `backToProducts()`.
- Produces on `InventoryPage`: `removeButtons` (`getByTestId(/^remove-/)`, with a comment that a card's button changes test id from `add-to-cart-*` to `remove-*` once clicked), `itemCard(name)`, `addToCartButtonFor(name)`, `removeButtonFor(name)`, `addToCart(name)`, `removeFromCart(name)`, `openProduct(name)`. The button lookups are `this.itemCard(name).locator(this.addToCartButtons)` and the same with `removeButtons`. `openProduct` clicks `this.itemNames.filter({ hasText: name })`.
- Produces fixture `productDetailPage`.

- [ ] **Step 1: RED — write the spec**

`beforeEach` calls `inventoryPage.goto()` then `inventoryPage.openProduct(products.fleeceJacket.name)`. Fleece Jacket is used because it isn't the first card, so opening the wrong product can't pass by accident.

| Scenario | Title | Assertions |
|---|---|---|
| PROD-06 | `opens the detail page with the same name, description and price @regression` | URL is `/inventory-item.html?id=${id}`; `name`, `description` and `price` match the product, with `formatPrice` on the price |
| PROD-07 | `returns to inventory with back to products @regression` | After `backToProducts()`: URL `/inventory.html`, `inventoryPage.title` is `Products` |
| PROD-08 | `adds to the cart from the detail page @regression` | After `addToCart()`: `header.cartBadge` is `1`, `removeButton` text is `Remove`, `addToCartButton` hidden |

Run: `npx playwright test tests/products/product-detail.spec.js; echo "exit=$?"`
Expected: `exit=1`, all fail on `openProduct is not a function`.

- [ ] **Step 2: Implement the page, the `InventoryPage` additions and the fixture**

Run the Step 1 command.
Expected: 4 passed (setup plus 3), `exit=0`.

- [ ] **Step 3: Commit**

Message: `Add ProductDetailPage and product detail tests`

---

### Task 4: Cart page

**Files:**
- Create: `pages/CartPage.js`, `tests/cart/cart.spec.js`
- Modify: `components/HeaderComponent.js`, `pages/BasePage.js`, `fixtures/pages.fixture.js`

**Interfaces:**
- Consumes from Task 3: the `InventoryPage` per-product methods and `productDetailPage`.
- Produces `CartPage` with `header`, `title`, `items`, `itemNames`, `itemPrices`, `itemQuantities` (`item-quantity`), `removeButtons`, `continueShoppingButton` (`continue-shopping`), `checkoutButton` (`checkout`), plus `goto()`, `removeItem(name)`, `continueShopping()`, `checkout()`.
- Produces `HeaderComponent.openCart()` and `BasePage.reload()`. Fixture `cartPage`.

- [ ] **Step 1: RED — write the spec**

`beforeEach` calls `inventoryPage.goto()`. Tests call `inventoryPage.header.openCart()` to reach the cart.

| Scenario | Title and tags | Arrange and act | Assertions |
|---|---|---|---|
| CART-01 | `adds one product from inventory @smoke @regression` | Add backpack | Badge `1`; `removeButtonFor(backpack)` text `Remove` |
| CART-02 | `adds three products @regression` | Add three | Badge `3` |
| CART-03 | `removes a product from the inventory page @regression` | Add backpack and onesie, remove backpack | Badge `1`; `addToCartButtonFor(backpack)` text `Add to cart`; `removeButtonFor(onesie)` still `Remove` |
| CART-04 | `shows added items with name, price and quantity @regression` | Add fleece jacket, onesie, backpack (ids 5,2,4: not name, price or id order), open cart | `itemNames` and `itemPrices` in add order; `itemQuantities` `['1','1','1']` |
| CART-05 | `removes an item from the cart page @regression` | Add backpack and onesie, open cart, remove backpack | `itemNames` is `[onesie]`; badge `1` |
| CART-06 | `empties the cart when every item is removed @regression` | Add two, open cart, remove both | `items` count `0`; badge hidden |
| CART-07 | `returns to inventory with continue shopping @regression` | Open cart, `continueShopping()` | URL `/inventory.html` |
| CART-08 | `keeps items after a page reload @regression` | Add two, open cart, confirm `itemNames`, `cartPage.reload()` | `itemNames` unchanged; badge `2` |
| CART-09 | `keeps the badge when visiting a product and coming back @regression` | Add backpack, `openProduct(bikeLight)` | On detail: `productDetailPage.name` is the bike light (proves the page changed), badge `1`. After `backToProducts()`: inventory `title` is `Products`, badge `1` |
| CART-10 | `allows checkout with an empty cart @regression @negative` | Open cart, assert `items` count `0`, `checkout()` | URL `/checkout-step-one.html`; `title` is `Checkout: Your Information`. A comment notes SauceDemo allows this and that the test documents it rather than endorses it |

Run: `npx playwright test tests/cart/cart.spec.js; echo "exit=$?"`
Expected: `exit=1`, failing on the missing `cartPage` or `openCart`.

- [ ] **Step 2: Implement the page, `openCart`, `reload` and the fixture**

`removeItem(name)` is `this.items.filter({ hasText: name }).locator(this.removeButtons).click()`.

Run the Step 1 command.
Expected: 11 passed (setup plus 10), `exit=0`.

- [ ] **Step 3: Mutation — cart assertions must detect a wrong row**

Temporarily change CART-04's expected names to A-Z order. Run with `-g "shows added items"`.
Expected: `exit=1`. Revert.

- [ ] **Step 4: Confirm the import rules hold**

Run the Grep tool in `tests/` for `new [A-Z]\w+Page|@playwright/test|page\.getBy|waitForTimeout`.
Expected: no matches. Also search `tests/products` and `tests/cart` for `Sauce Labs` and `\$\d`.
Expected: no matches.

- [ ] **Step 5: Parallel stability**

Run: `npx playwright test tests/cart tests/products --repeat-each=3; echo "exit=$?"`
Expected: `exit=0`, with every test passing on all 3 repeats. Treat any intermittent failure as a bug, and don't add waits or retries.

- [ ] **Step 6: Commit**

Message: `Add CartPage and cart tests`

---

### Task 5: Full verification and docs

**Files:**
- Modify: `README.md`, `PROJECT_PLAN.md`, `CLAUDE.md` (local handoff file, stays untracked)

- [ ] **Step 1: Filtered runs from a clean state**

Before each, run `rm -rf .auth`.

| Command | Expected |
|---|---|
| `npm run test:smoke; echo "exit=$?"` | 4 passed (setup, AUTH-01, PROD-01, CART-01), `exit=0` |
| `npm run test:negative; echo "exit=$?"` | 10 passed (setup, 6 auth, PROD-09, PROD-10, CART-10), `exit=0` |
| `npm run test:regression; echo "exit=$?"` | 31 passed (setup plus 30), `exit=0` |
| `npm run test:chromium; echo "exit=$?"` | 31 passed (setup plus 30), `exit=0` |

- [ ] **Step 2: Confirm the saved state stays clean**

Read `.auth/standard.json`.
Expected: a `session-username` cookie and no `cart-contents`.

- [ ] **Step 3: Check the Done-when and record the duration**

Run: `npx playwright test --reporter=json` with output sent to the scratchpad, then read it.
Expected: `stats.unexpected` is 0, and only PROD-09 and PROD-10 have `expectedStatus: failed`. Record the total duration against the 10-minute cookie limit.

- [ ] **Step 4: Update docs**

- `README.md`: add a short "Known app bugs" section saying `problem_user` sorting and images are tracked with `test.fail`, that those two show `✘` in the list output but count as passed, and that a run goes red if they start passing.
- `PROJECT_PLAN.md`: status line becomes `Phases 1 to 5 complete, Phase 6 next`. §5.1 rule 6 gains: `Pages that link back to each other (inventory, detail, cart) return nothing, because returning the next page would create circular requires; tests get them from fixtures.` §8 Phase 6 task 5 drops CART-10. §6.3 CART-08 says `localStorage` rather than `cookie / localStorage`. §8 Phase 5's Done-when gains `(checked in JSON output; the terminal shows ✘ and counts them as passed)`.
- `CLAUDE.md`: update status, commit hash and test counts. Add the recon facts (stale DOM after clicking into the cart, shared test ids, `test.fail` reporting table). Remove the Phase 2 finding about the `addToCartButtons` comment, since Task 3 resolves it.

- [ ] **Step 5: Run the suite once more**

Run: `npx playwright test; echo "exit=$?"`
Expected: 31 passed, `exit=0`.

- [ ] **Step 6: Commit**

Stage `README.md` and `PROJECT_PLAN.md` only.
Message: `Document known app bugs and record Phase 5 completion`

---

## Finish

1. Run one fresh whole-branch review and resolve its findings.
2. Merge to `main` with `--no-ff` as `Merge phase-5-products-cart`, push `main` and the branch, and confirm CI is green on `main`.
3. Explain the concepts in plain words: `locator.all()` vs `allTextContents()`, `nth()`, `filter({ hasText })`, `test.fail` vs `test.skip` vs `test.fixme`, and asserting on sorted arrays. Phase 5's code uses neither `locator.all()` nor `nth()`, so explain those by contrast with what it does use.
