# ShopFlow — E-commerce Test Automation Framework

**Project plan and documentation**
Owner: Rahul Gupta · Created: 2026-10-20 · Status: Phases 1 to 4 complete, Phase 5 next

---

## 1. Purpose

ShopFlow is a learning project whose output is a portfolio-grade end-to-end test automation framework built with Playwright and JavaScript. It targets a public demo e-commerce site and covers authentication, product selection, shopping cart, and checkout workflows.

The project exists to make the following resume claim true and defensible in an interview:

> Developing an end-to-end test automation framework for an e-commerce application, covering user authentication, product selection, shopping cart, and checkout workflows. Implementing reusable Page Object Model components, automated assertions, positive and negative test scenarios, and test execution reports using Playwright.

Every phase below ends with something runnable and with a short list of concepts you should be able to explain without notes.

---

## 2. Application under test

**Primary target: SauceDemo** — https://www.saucedemo.com

Why this site:

- Login page with several documented user types that produce different behaviour.
- Product inventory with sorting (name A–Z / Z–A, price low–high / high–low).
- Cart with add, remove, and badge count.
- Three-step checkout (customer info → overview → complete) with validation errors.
- Stable `data-test` attributes on most elements, which makes it ideal for `getByTestId`.
- Public, free, no account creation, no rate limiting.

### Test users

| Username                  | Password       | Behaviour                                                  | Used for                              |
|---------------------------|----------------|------------------------------------------------------------|---------------------------------------|
| `standard_user`           | `secret_sauce` | Normal, fully working account                              | All positive flows                    |
| `locked_out_user`         | `secret_sauce` | Login rejected with "locked out" error                     | Negative auth                         |
| `problem_user`            | `secret_sauce` | Wrong images, broken sorting, some buttons do nothing      | Bug-discovery tests, `test.fail`      |
| `performance_glitch_user` | `secret_sauce` | Login and navigation are slow                              | Timeout and auto-wait exploration     |
| `error_user`              | `secret_sauce` | Some actions throw errors                                  | Stretch: console error assertions     |
| `visual_user`             | `secret_sauce` | Visual differences on pages                                | Stretch: visual regression            |

Credentials are public and are not secrets, but the project still reads them from `.env` so the framework pattern is correct.

### Key routes

| Route                       | Page object            |
|-----------------------------|------------------------|
| `/`                         | `LoginPage`            |
| `/inventory.html`           | `InventoryPage`        |
| `/inventory-item.html?id=N` | `ProductDetailPage`    |
| `/cart.html`                | `CartPage`             |
| `/checkout-step-one.html`   | `CheckoutInfoPage`     |
| `/checkout-step-two.html`   | `CheckoutOverviewPage` |
| `/checkout-complete.html`   | `CheckoutCompletePage` |

---

## 3. Technology stack

| Concern         | Choice                                   | Notes                                                  |
|-----------------|------------------------------------------|--------------------------------------------------------|
| Language        | JavaScript (CommonJS)                    | Matches the resume. TypeScript is a later migration.  |
| Runtime         | Node.js 24 (installed: v24.18.0)         | Any LTS ≥ 20 works (Playwright 1.64 engines)           |
| Test runner     | `@playwright/test`                       | Built-in fixtures, parallelism, retries, reporters    |
| Browsers        | Chromium, Firefox, WebKit                | Chromium only during development                      |
| Design pattern  | Page Object Model + custom fixtures      | See section 5                                          |
| Config          | `dotenv`                                 | `.env` ignored, `.env.example` committed               |
| Reporting       | Playwright HTML reporter + `list`        | Traces, screenshots, videos on failure                 |
| CI              | GitHub Actions                           | Report uploaded as workflow artifact                   |
| Lint/format     | ESLint + Prettier                        | Optional but recommended, Phase 7                      |

---

## 4. Repository structure

```
shopflow/
├── .github/
│   └── workflows/
│       └── playwright.yml          # CI: install, run, upload report
├── .auth/                          # storageState files (git-ignored)
├── data/
│   ├── users.js                    # user credentials read from env
│   ├── products.js                 # known product names / prices
│   └── checkout.data.js            # valid and invalid customer info
├── fixtures/
│   └── pages.fixture.js            # extends `test` with page-object fixtures
├── pages/
│   ├── BasePage.js
│   ├── LoginPage.js
│   ├── InventoryPage.js
│   ├── ProductDetailPage.js
│   ├── CartPage.js
│   ├── CheckoutInfoPage.js
│   ├── CheckoutOverviewPage.js
│   └── CheckoutCompletePage.js
├── components/
│   └── HeaderComponent.js          # cart badge, burger menu, logout
├── tests/
│   ├── auth.setup.js               # logs in once, saves storageState
│   ├── auth/
│   │   ├── login.positive.spec.js
│   │   └── login.negative.spec.js
│   ├── products/
│   │   ├── inventory.spec.js
│   │   └── product-detail.spec.js
│   ├── cart/
│   │   └── cart.spec.js
│   ├── checkout/
│   │   ├── checkout.positive.spec.js
│   │   └── checkout.negative.spec.js
│   └── e2e/
│       └── purchase-journey.spec.js # full smoke journey
├── utils/
│   ├── price.js                    # "$29.99" -> 29.99, tax calc
│   └── logger.js
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.js
├── package.json
├── playwright.config.js
├── PROJECT_PLAN.md                 # this file
└── README.md                       # short: how to install and run
```

---

## 5. Framework design

### 5.1 Page Object Model rules

1. A page object owns **locators** and **actions** for one page. It never contains `expect`.
2. Tests own **assertions**. A test reads like a user story; a page object reads like a remote control.
3. Every page object extends `BasePage`, which holds `page`, `goto(path)`, and shared helpers.
4. Locators are defined once in the constructor as `this.x = page.getByTestId(...)`. No locator strings inside methods.
5. Shared UI that appears on several pages (header, cart badge, menu) lives in `components/`, not duplicated in each page.
6. Multi-step actions that span pages return the next page object, for example `checkoutInfoPage.continue()` returns a `CheckoutOverviewPage`.

Example skeleton:

```js
// pages/LoginPage.js
const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
  }

  async goto() {
    await super.goto('/');
  }

  async login(username, password) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }
}

module.exports = { LoginPage };
```

### 5.2 Custom fixtures

`fixtures/pages.fixture.js` extends the base `test` so every spec receives ready-made page objects:

```js
const base = require('@playwright/test');
const { LoginPage } = require('../pages/LoginPage');
const { InventoryPage } = require('../pages/InventoryPage');
// ...

exports.test = base.test.extend({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  // ...
});
exports.expect = base.expect;
```

Specs then import `test` and `expect` from the fixture file instead of from `@playwright/test`.

### 5.3 Authentication state

- `tests/auth.setup.js` runs as a dedicated `setup` project, logs in as `standard_user`, and saves `.auth/standard.json`.
- All non-auth projects declare `dependencies: ['setup']` and `storageState: '.auth/standard.json'`.
- Auth tests themselves use `test.use({ storageState: { cookies: [], origins: [] } })` to start logged out.

Result: login UI is exercised only by the auth suite; everything else starts on `/inventory.html` immediately.

### 5.4 Locator strategy

Priority order:

1. `getByTestId` — config sets `testIdAttribute: 'data-test'` to match SauceDemo.
2. `getByRole` with accessible name.
3. `getByText` for static copy such as error messages.
4. CSS selectors only as a last resort, and never XPath.

### 5.5 Test data

- `data/users.js` reads `process.env.STANDARD_USER`, etc., with the public defaults as fallback.
- `data/products.js` lists the six products with names and prices so tests can assert totals without hard-coding strings in specs.
- `data/checkout.data.js` exports a `validCustomer` object and an array of `invalidCustomers`, each with one field left blank and the expected error text, for data-driven negative tests.

### 5.6 Tagging

Tests are tagged in their title: `@smoke`, `@regression`, `@negative`. npm scripts filter with `--grep`. Every `@smoke` test also carries `@regression`, so `test:regression` is the full suite.

---

## 6. Test scenarios

Legend: **P** positive · **N** negative · **S** smoke tag

### 6.1 Authentication (`tests/auth/`)

| ID      | Type | Scenario                                                             | Expected result                                             |
|---------|------|----------------------------------------------------------------------|-------------------------------------------------------------|
| AUTH-01 | P S  | standard_user logs in with valid credentials                         | URL is `/inventory.html`, page title "Products" visible     |
| AUTH-02 | P    | Logged-in user logs out from burger menu                             | Returns to `/`, login button visible                        |
| AUTH-03 | N    | locked_out_user logs in                                              | Error: "Sorry, this user has been locked out."              |
| AUTH-04 | N    | Valid username, wrong password                                       | Error: "Username and password do not match any user..."     |
| AUTH-05 | N    | Empty username and password                                          | Error: "Username is required"                               |
| AUTH-06 | N    | Username only, empty password                                        | Error: "Password is required"                               |
| AUTH-07 | N    | Error message can be dismissed with the X button                     | Error locator hidden                                        |
| AUTH-08 | N    | Direct navigation to `/inventory.html` without login                 | Redirected to `/` with "You can only access..." error       |
| AUTH-09 | P    | performance_glitch_user logs in                                      | Lands on inventory within default timeout (auto-wait demo)  |

AUTH-04 to AUTH-06 are implemented as one data-driven test over an array of cases.

### 6.2 Products (`tests/products/`)

| ID      | Type | Scenario                                                             | Expected result                                             |
|---------|------|----------------------------------------------------------------------|-------------------------------------------------------------|
| PROD-01 | P S  | Inventory page lists all products                                    | Exactly 6 product cards, each with name, price, image, button |
| PROD-02 | P    | Sort by Name (A to Z)                                                | Names in ascending order                                    |
| PROD-03 | P    | Sort by Name (Z to A)                                                | Names in descending order                                   |
| PROD-04 | P    | Sort by Price (low to high)                                          | Parsed prices ascending                                     |
| PROD-05 | P    | Sort by Price (high to low)                                          | Parsed prices descending                                    |
| PROD-06 | P    | Click product name opens detail page                                 | Detail shows same name, description, price                  |
| PROD-07 | P    | "Back to products" from detail                                       | Returns to inventory                                        |
| PROD-08 | P    | Add to cart from detail page                                         | Badge shows 1, button text becomes "Remove"                 |
| PROD-09 | N    | problem_user sorts by price                                          | `test.fail`: sorting is known broken for this user          |
| PROD-10 | N    | problem_user product images                                          | `test.fail`: all images share the same broken src           |

### 6.3 Cart (`tests/cart/`)

| ID      | Type | Scenario                                                             | Expected result                                             |
|---------|------|----------------------------------------------------------------------|-------------------------------------------------------------|
| CART-01 | P S  | Add one product from inventory                                       | Badge = 1, button becomes "Remove"                          |
| CART-02 | P    | Add three products                                                   | Badge = 3                                                   |
| CART-03 | P    | Remove product from inventory page                                   | Badge decrements, button becomes "Add to cart"              |
| CART-04 | P    | Cart page shows added items with correct name, price, quantity       | Rows match what was added                                   |
| CART-05 | P    | Remove item from cart page                                           | Row disappears, badge updates                               |
| CART-06 | P    | Remove all items                                                     | Badge locator hidden                                        |
| CART-07 | P    | "Continue Shopping" returns to inventory                             | URL `/inventory.html`                                       |
| CART-08 | P    | Cart persists after page reload                                      | Items still present (cookie / localStorage)                 |
| CART-09 | P    | Cart persists across navigation to product detail and back           | Badge unchanged                                             |
| CART-10 | N    | Checkout with empty cart                                             | Document actual behaviour (SauceDemo allows it); assert it  |

### 6.4 Checkout (`tests/checkout/`)

| ID      | Type | Scenario                                                             | Expected result                                             |
|---------|------|----------------------------------------------------------------------|-------------------------------------------------------------|
| CHK-01  | P S  | Full checkout with one item                                          | "Thank you for your order!" and "Back Home" button          |
| CHK-02  | P    | Overview lists the exact items from the cart                         | Names and prices match                                      |
| CHK-03  | P    | Item total equals sum of item prices                                 | Computed from `data/products.js`                            |
| CHK-04  | P    | Tax is 8% of item total (rounded to cents)                           | `tax === round(subtotal * 0.08, 2)`                         |
| CHK-05  | P    | Total equals item total + tax                                        | Exact match                                                 |
| CHK-06  | P    | Cancel from step one returns to cart                                 | URL `/cart.html`, items intact                              |
| CHK-07  | P    | Cancel from overview returns to inventory                            | URL `/inventory.html`, cart still has items                 |
| CHK-08  | P    | "Back Home" after completion                                         | Inventory page, badge hidden (cart cleared)                 |
| CHK-09  | N    | Empty first name                                                     | Error: "Error: First Name is required"                      |
| CHK-10  | N    | Empty last name                                                      | Error: "Error: Last Name is required"                       |
| CHK-11  | N    | Empty postal code                                                    | Error: "Error: Postal Code is required"                     |
| CHK-12  | N    | All fields empty                                                     | First Name error shown first                                |
| CHK-13  | N    | Direct navigation to `/checkout-step-two.html` with empty cart       | Document actual behaviour and assert it                     |

CHK-09 to CHK-11 are one data-driven test.

### 6.5 End-to-end journey (`tests/e2e/`)

| ID     | Type | Scenario                                                                                   |
|--------|------|--------------------------------------------------------------------------------------------|
| E2E-01 | P S  | Login → sort by price low-high → add cheapest and most expensive → verify cart → checkout → verify totals → complete → back home → cart empty |

This is the single test to run when you want a 30-second health check of the whole framework.

### Coverage summary

| Area           | Positive | Negative | Total |
|----------------|----------|----------|-------|
| Authentication | 3        | 6        | 9     |
| Products       | 8        | 2        | 10    |
| Cart           | 9        | 1        | 10    |
| Checkout       | 8        | 5        | 13    |
| E2E            | 1        | 0        | 1     |
| **Total**      | **29**   | **14**   | **43**|

---

## 7. Configuration

### 7.1 `playwright.config.js` (target shape)

```js
// @ts-check
require('dotenv').config({ quiet: true });
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.js/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/standard.json' },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/standard.json' },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: '.auth/standard.json' },
      dependencies: ['setup'],
    },
  ],
});
```

### 7.2 `.env.example`

```
BASE_URL=https://www.saucedemo.com
STANDARD_USER=standard_user
LOCKED_OUT_USER=locked_out_user
PROBLEM_USER=problem_user
PERFORMANCE_GLITCH_USER=performance_glitch_user
PASSWORD=secret_sauce
```

### 7.3 npm scripts

```json
{
  "scripts": {
    "test": "playwright test",
    "test:chromium": "playwright test --project=chromium",
    "test:all-browsers": "playwright test --project=chromium --project=firefox --project=webkit",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:negative": "playwright test --grep @negative",
    "test:headed": "playwright test --headed --project=chromium",
    "test:debug": "playwright test --debug --project=chromium",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report",
    "codegen": "playwright codegen https://www.saucedemo.com",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```

### 7.4 `.gitignore`

```
node_modules/
.env
.auth/
test-results/
playwright-report/
blob-report/
playwright/.cache/
```

---

## 8. Implementation phases

Each phase is roughly one focused session of 2–4 hours. Do them in order; later phases assume earlier ones.

### Phase 1 — Scaffold and first test

**Goal:** A running Playwright project with one honest test and the HTML report open in a browser.

Tasks:
1. `cd shopflow && npm init playwright@latest` — choose JavaScript, `tests` folder, add GitHub Actions workflow, install browsers.
2. Delete the example specs. Install `dotenv`. Create `.env` from `.env.example`.
3. Write `playwright.config.js` as in section 7.1 but with only the `chromium` project and no `setup` yet.
4. Write `tests/auth/login.positive.spec.js` with **no page objects**: fill username, fill password, click, `expect(page).toHaveURL(/inventory/)`.
5. Run `npx playwright test`, then `npx playwright show-report`.
6. Deliberately break the test, re-run, open the trace.

Done when: test passes, you have opened the trace viewer at least once.

Concepts to explain: auto-waiting, web-first assertions (`expect(locator).toBeVisible()` retries, `expect(await locator.isVisible())` does not), trace viewer, `baseURL`.

### Phase 2 — Page Object Model

**Goal:** The login test rewritten over page objects, and the first inventory test.

Tasks:
1. Create `pages/BasePage.js`, `pages/LoginPage.js`, `pages/InventoryPage.js`.
2. Refactor the Phase 1 test to use `LoginPage` and `InventoryPage`.
3. Add `components/HeaderComponent.js` with cart badge and menu locators; compose it into `InventoryPage`.
4. Write PROD-01 (six products listed).
5. Write a short `README.md` with install and run instructions.

Done when: no `page.getBy…` calls remain inside spec files.

Concepts to explain: why POM, what belongs in a page vs a test, composition over inheritance for shared components, returning the next page from actions.

### Phase 3 — Authentication suite

**Goal:** AUTH-01 to AUTH-09 passing.

Tasks:
1. Create `data/users.js`.
2. Write `login.negative.spec.js` with a data-driven loop for AUTH-04 to AUTH-06.
3. Add AUTH-03, AUTH-07, AUTH-08.
4. Add AUTH-02 logout using `HeaderComponent`.
5. Add AUTH-09 with `performance_glitch_user` and observe that auto-wait handles it with no sleeps.
6. Add `@smoke` and `@negative` tags and the matching npm scripts.

Done when: `npm run test:negative` runs only negative tests and all pass.

Concepts to explain: `test.describe`, data-driven tests via `for…of` over cases, `test.step` for readable reports, tags and `--grep`.

### Phase 4 — Fixtures and authentication state

**Goal:** Tests outside `auth/` never see the login page.

Tasks:
1. Create `fixtures/pages.fixture.js` exporting extended `test` and `expect`.
2. Migrate every spec to import from the fixture.
3. Create `tests/auth.setup.js` that logs in and calls `page.context().storageState({ path: '.auth/standard.json' })`.
4. Add the `setup` project and `dependencies` to the config; add `.auth/` to `.gitignore`.
5. In `tests/auth/*.spec.js`, add `test.use({ storageState: { cookies: [], origins: [] } })`.
6. Rewrite PROD-01 to start at `inventoryPage.goto()` directly.

Done when: running only `products/inventory.spec.js` shows the setup project run once, then the test starts on the inventory page.

Concepts to explain: fixtures vs `beforeEach`, fixture scopes (test vs worker), `storageState`, project dependencies, why this makes suites faster and less flaky.

### Phase 5 — Products and cart

**Goal:** PROD-02 to PROD-10 and CART-01 to CART-10 passing.

Tasks:
1. Create `data/products.js` and `utils/price.js`.
2. Implement sorting tests PROD-02 to PROD-05 by reading all names/prices with `allTextContents()` and comparing to a sorted copy.
3. Create `pages/ProductDetailPage.js`; implement PROD-06 to PROD-08.
4. Create `pages/CartPage.js`; implement CART-01 to CART-10.
5. Add a `problem_user` describe block with `test.fail()` for PROD-09 and PROD-10, documenting the known bugs in comments.

Done when: all product and cart tests pass on Chromium, and the two `test.fail` tests are reported as "expected failure", not as passes.

Concepts to explain: `locator.all()` vs `allTextContents()`, `nth()`, `filter({ hasText })`, `test.fail` vs `test.skip` vs `test.fixme`, asserting on sorted arrays.

### Phase 6 — Checkout

**Goal:** CHK-01 to CHK-13 and E2E-01 passing.

Tasks:
1. Create `pages/CheckoutInfoPage.js`, `CheckoutOverviewPage.js`, `CheckoutCompletePage.js`.
2. Create `data/checkout.data.js` with `validCustomer` and `invalidCustomers`.
3. Implement positive tests CHK-01 to CHK-08, computing expected totals from `data/products.js` and `utils/price.js`.
4. Implement data-driven CHK-09 to CHK-12.
5. Implement CHK-13 and CART-10: run them once manually, record what SauceDemo actually does, and assert that behaviour.
6. Write `tests/e2e/purchase-journey.spec.js` using `test.step` for each stage.

Done when: `npm run test:smoke` runs AUTH-01, PROD-01, CART-01, CHK-01, E2E-01 and passes in under a minute.

Concepts to explain: `test.step` and how it appears in the HTML report, floating-point rounding in money assertions, chaining page objects across a multi-page flow.

### Phase 7 — Reporting, cross-browser, CI, code quality

**Goal:** A green GitHub Actions badge and a downloadable HTML report on every push.

Tasks:
1. Enable `firefox` and `webkit` projects. Fix any browser-specific failures (expect at least one).
2. Confirm `screenshot`, `video`, `trace` settings behave as intended by forcing a failure.
3. Finalise `.github/workflows/playwright.yml`: checkout, setup-node, `npm ci`, `npx playwright install --with-deps`, `npx playwright test`, `actions/upload-artifact` for `playwright-report/` with `if: always()`.
4. Add ESLint (`eslint-plugin-playwright`) and Prettier. Fix lint findings. Add a `lint` job to CI.
5. Set `retries: 2` in CI and deliberately introduce one flaky test to watch retry behaviour, then remove it.
6. Initialise git if not already done, push to GitHub, add the workflow badge to `README.md`.

Done when: a push triggers the workflow, it passes, and the HTML report is downloadable from the run.

Concepts to explain: workers and parallelism, sharding, retries and flaky-test policy, `forbidOnly`, why `--with-deps`, artifact retention.

### Phase 8 — Stretch goals

Pick any, in any order, once Phases 1–7 are done.

| Goal                        | What you build                                                                                     | Concept learned                          |
|-----------------------------|----------------------------------------------------------------------------------------------------|------------------------------------------|
| Visual regression           | `toHaveScreenshot()` on inventory and cart pages; run with `visual_user` and watch it fail         | Snapshot management, `--update-snapshots`|
| Console error detection     | Fixture that collects `page.on('console')` errors and fails the test if any; run with `error_user` | Event listeners, custom fixtures         |
| Accessibility checks        | `@axe-core/playwright` scan on each page                                                           | Automated a11y                           |
| Mobile viewport             | Add `Pixel 7` project; adjust `HeaderComponent` for mobile menu                                    | Device emulation                         |
| Sharding in CI              | Matrix strategy with `--shard=1/3`, merge with `merge-reports`                                     | Blob reporter, scaling                   |
| Allure or Monocart reporter | Second reporter with history and trends                                                            | Reporter plugins                         |
| TypeScript migration        | Rename to `.ts`, add types to page objects                                                         | Type safety in test code                 |
| Second target app           | Point the same framework at automationexercise.com with registration flows                         | Framework reuse, abstraction quality     |

---

## 9. Conventions

**Naming**
- Spec files: `<feature>.<positive|negative>.spec.js` or `<feature>.spec.js`.
- Page classes: `PascalCasePage.js`, exported as a named export.
- Test titles: behaviour in plain English, present tense, lowercase start, with tags at the end.
  Good: `shows locked out error for locked_out_user @negative`
  Bad: `Test login 3`

**Assertions**
- One behaviour per test. Several `expect` calls are fine if they all verify that one behaviour.
- Always use web-first assertions on locators. Never `expect(await locator.textContent()).toBe(...)` when `toHaveText` exists.

**Waiting**
- No `page.waitForTimeout()`. If you reach for it, find the condition you are actually waiting for and assert on that.

**Data**
- No credentials or product strings hard-coded in specs. They come from `data/`.

**Git**
- Branch per phase: `phase-1-scaffold`, `phase-2-pom`, etc. Merge to `main` when the phase's "Done when" is met.
- Commit messages in imperative mood: `Add CartPage and cart specs`.

---

## 10. Definition of done (whole project)

- [ ] All 43 scenarios in section 6 implemented and passing on Chromium, Firefox, WebKit.
- [ ] `test.fail` tests report as expected failures, not passes.
- [ ] Zero `waitForTimeout` calls in the repo.
- [ ] Zero locator strings inside spec files.
- [ ] `npm run test:smoke` completes in under 60 seconds locally.
- [ ] GitHub Actions passes on `main` and uploads the HTML report.
- [ ] ESLint and Prettier pass.
- [ ] `README.md` lets a stranger clone, install, and run tests in under five minutes.
- [ ] You can answer every "Concepts to explain" item in section 8 without notes.

---

## 11. Interview talking points

When this project comes up, be ready to speak to:

1. **Why Playwright over Selenium or Cypress.** Auto-waiting, multi-browser including WebKit, built-in test runner, trace viewer, first-class fixtures.
2. **How the framework is structured and why.** POM for maintainability, fixtures for dependency injection, data files for separation of data from logic, components for shared UI.
3. **How you handle authentication.** `storageState` via a setup project; auth tests opt out.
4. **How you handle flakiness.** No hard waits, web-first assertions, retries only in CI, traces on first retry so flaky failures are diagnosable.
5. **How negative tests are organised.** Data-driven loops over invalid cases; `test.fail` for known app bugs so they are tracked, not hidden.
6. **What the reports show.** HTML report with steps, screenshots, videos, and traces attached to failures; uploaded as CI artifacts.
7. **One concrete bug you found.** `problem_user` sorting or images; explain how the test exposes it.

---

## 12. Quick reference

```bash
# first-time setup
cd ~/shopflow
npm init playwright@latest      # JavaScript, tests folder, GitHub Actions, install browsers
npm install dotenv
npm install --save-dev eslint eslint-plugin-playwright prettier
cp .env.example .env

# everyday
npm test                        # everything, all configured projects
npm run test:chromium           # fast local loop
npm run test:smoke              # health check
npm run test:ui                 # interactive UI mode
npm run test:debug              # step through with Inspector
npm run report                  # open last HTML report
npx playwright show-trace test-results/<folder>/trace.zip
npm run codegen                 # record locators against SauceDemo
```
