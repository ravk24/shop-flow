# ShopFlow — E-commerce Test Automation Framework

**Project plan and documentation**
Owner: Rahul Gupta · Created: 2026-10-20 · Status: Phases 1 to 9 complete; Phase 10 (TypeScript) done

---

## 1. Purpose

ShopFlow is a learning project whose output is a portfolio-grade end-to-end test automation framework built with Playwright and TypeScript (written in JavaScript first, migrated in Phase 10). It targets a public demo e-commerce site and covers authentication, product selection, shopping cart, and checkout workflows.

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
| Language        | TypeScript 6.0 (strict, type-check only) | Playwright runs the `.ts` files itself; `tsc` emits nothing. Migrated from JavaScript in Phase 10 |
| Runtime         | Node.js 24 (installed: v24.18.0)         | 20.19+, 22.13+ or 24+ (ESLint 10's engines)           |
| Test runner     | `@playwright/test`                       | Built-in fixtures, parallelism, retries, reporters    |
| Browsers        | Chromium, Firefox, WebKit, Pixel 7 (Chromium) | `npm run test:chromium` is the fast local loop   |
| Design pattern  | Page Object Model + custom fixtures      | See section 5                                          |
| Config          | `dotenv`                                 | `.env` ignored, `.env.example` committed               |
| Reporting       | Playwright HTML reporter + `list`, Allure 3 | Traces, screenshots, videos on failure; Allure adds history and trends |
| Accessibility   | `@axe-core/playwright`                   | WCAG A/AA rules, Phase 8                               |
| CI              | GitHub Actions                           | Report uploaded as workflow artifact                   |
| Lint/format     | `tsc`, ESLint (type-aware) + Prettier    | Enforced in CI, warnings fail (Phase 7; types Phase 10) |

---

## 4. Repository structure

```
shopflow/
├── .github/
│   └── workflows/
│       └── playwright.yml          # CI: install, run, upload report
├── .auth/                          # storageState files (git-ignored)
├── data/
│   ├── users.ts                    # user credentials read from env
│   ├── products.ts                 # known product names / prices
│   └── checkout.data.ts            # valid and invalid customer info
├── fixtures/
│   └── pages.fixture.ts            # extends `test` with page-object fixtures
├── pages/
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── InventoryPage.ts
│   ├── ProductDetailPage.ts
│   ├── CartPage.ts
│   ├── CheckoutInfoPage.ts
│   ├── CheckoutOverviewPage.ts
│   └── CheckoutCompletePage.ts
├── components/
│   └── HeaderComponent.ts          # cart badge, burger menu, logout
├── tests/
│   ├── auth.setup.ts               # logs in once, saves storageState
│   ├── auth/
│   │   ├── login.positive.spec.ts
│   │   └── login.negative.spec.ts
│   ├── products/
│   │   ├── inventory.spec.ts
│   │   └── product-detail.spec.ts
│   ├── cart/
│   │   └── cart.spec.ts
│   ├── checkout/
│   │   ├── checkout.positive.spec.ts
│   │   └── checkout.negative.spec.ts
│   ├── console/
│   │   └── console-errors.spec.ts
│   ├── visual/
│   │   ├── visual.spec.ts
│   │   └── visual.spec.ts-snapshots/ # baselines per browser and OS
│   ├── a11y/
│   │   └── a11y.spec.ts
│   ├── mobile/
│   │   └── layout.spec.ts
│   └── e2e/
│       └── purchase-journey.spec.ts # full smoke journey
├── reporters/
│   └── allure.ts                   # Allure reporter fixed for merge-reports, clears old results
├── scripts/
│   └── update-linux-snapshots.js   # Linux baselines in Playwright's Docker image
├── utils/
│   ├── a11y.ts                     # WCAG tags, readable violation list
│   ├── console.ts                  # known console noise filter
│   └── price.ts                    # "$29.99" -> 29.99, tax calc
├── .env.example
├── .gitignore
├── .prettierrc
├── allurerc.mjs                    # Allure output, history file, single-file report
├── eslint.config.js
├── package.json
├── playwright.config.ts
├── playwright.merge.config.ts      # CI: HTML and Allure from the merged shards
├── PROJECT_PLAN.md                 # this file
├── README.md                       # short: how to install and run
└── tsconfig.json                   # strict type-checking, no output
```

---

## 5. Framework design

### 5.1 Page Object Model rules

1. A page object owns **locators** and **actions** for one page. It never contains `expect`.
2. Tests own **assertions**. A test reads like a user story; a page object reads like a remote control.
3. Every page object extends `BasePage`, which holds `page`, `goto(path)`, and shared helpers.
4. Locators are defined once in the constructor as `this.x = page.getByTestId(...)`. No locator strings inside methods.
5. Shared UI that appears on several pages (header, cart badge, menu) lives in `components/`, not duplicated in each page.
6. Multi-step actions that span pages return the next page object, for example `checkoutInfoPage.continue()` returns a `CheckoutOverviewPage`. Pages that link back to each other (inventory, detail, cart) return nothing, because returning the next page would create circular requires; tests get them from fixtures.

Example skeleton:

```ts
// pages/LoginPage.ts
import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.getByTestId('username');
    this.password = page.getByTestId('password');
    this.loginButton = page.getByTestId('login-button');
    this.errorMessage = page.getByTestId('error');
  }

  override async goto(): Promise<void> {
    await super.goto('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }
}
```

### 5.2 Custom fixtures

`fixtures/pages.fixture.ts` extends the base `test` so every spec receives ready-made page objects:

```ts
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
// ...

type Fixtures = { loginPage: LoginPage; inventoryPage: InventoryPage /* ... */ };

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  // ...
});
export { expect };
```

The `Fixtures` type is what lets a spec's `async ({ loginPage })` know `loginPage` is a `LoginPage`, so a misspelt method is a type error rather than a runtime one.

Specs then import `test` and `expect` from the fixture file instead of from `@playwright/test`.

### 5.3 Authentication state

- `tests/auth.setup.ts` runs as a dedicated `setup` project, logs in as `standard_user`, and saves `.auth/standard.json`.
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

- `data/users.ts` reads `process.env.STANDARD_USER`, etc., with the public defaults as fallback.
- `data/products.ts` lists the six products with names and prices so tests can assert totals without hard-coding strings in specs.
- `data/checkout.data.ts` exports a `validCustomer` object and an array of `invalidCustomers` (one blank field each, plus one with all three blank) with the expected error text, for data-driven negative tests.
- `data/login.data.ts` exports `invalidLogins`, the data-driven login failures.

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
| PROD-11 | P    | Header on a fresh inventory page                                     | Cart link visible, no badge                                 |
| PROD-12 | P    | Burger menu opens                                                    | Logout link in the viewport                                 |

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
| CART-08 | P    | Cart persists after page reload                                      | Items still present (localStorage)                          |
| CART-09 | P    | Cart persists across navigation to product detail and back           | Badge unchanged                                             |
| CART-10 | N    | Checkout with empty cart                                             | Document actual behaviour (SauceDemo allows it); assert it  |

### 6.4 Checkout (`tests/checkout/`)

| ID      | Type | Scenario                                                             | Expected result                                             |
|---------|------|----------------------------------------------------------------------|-------------------------------------------------------------|
| CHK-01  | P S  | Full checkout with one item                                          | "Thank you for your order!" and "Back Home" button          |
| CHK-02  | P    | Overview lists the exact items from the cart                         | Names and prices match                                      |
| CHK-03  | P    | Item total equals sum of item prices                                 | Computed from `data/products.ts`                            |
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
| CHK-14  | N    | Item total shows a raw float for some carts                          | `test.fail`: known bug                                      |

CHK-09 to CHK-12 are one data-driven test.

### 6.5 End-to-end journey (`tests/e2e/`)

| ID     | Type | Scenario                                                                                   |
|--------|------|--------------------------------------------------------------------------------------------|
| E2E-01 | P S  | Login → sort by price low-high → add cheapest and most expensive → verify cart → checkout → verify totals → complete → back home → cart empty |

This is the single test to run when you want a 30-second health check of the whole framework.

### 6.6 Console errors (`tests/console/`)

| ID     | Type | Scenario                                                  | Expected result                                                  |
|--------|------|-----------------------------------------------------------|------------------------------------------------------------------|
| CON-01 | N    | Page logs a `console.error`                               | The message is collected                                         |
| CON-02 | N    | Page throws an uncaught exception                         | The message is collected                                         |
| CON-03 | N    | Page logs an error, with the fixture's check on           | `test.fail`: the fixture's teardown fails the test               |
| CON-04 | N    | Page requests a resource that doesn't exist               | Collected. Skipped on Firefox, which doesn't log failed resources |
| CON-05 | N    | error_user adds the Bolt T-Shirt                          | Known bug: `Failed to add item to the cart.`, and the badge stays hidden |
| CON-06 | P    | error_user adds the Backpack, with the fixture's check on | Badge shows 1 and the test passes                                |
| CON-07 | P    | Logging in triggers SauceDemo's telemetry                 | Answered locally with 200 by the `stubTelemetry` fixture, not by the real service (401) |

### 6.7 Visual regression (`tests/visual/`)

Baselines are kept per browser and per OS: `win32` made locally, `linux` made in Playwright's Docker image, which CI also runs in.

| ID     | Type | Scenario                                        | Expected result                                                                 |
|--------|------|-------------------------------------------------|---------------------------------------------------------------------------------|
| VIS-01 | P    | Inventory page, full page, prices hidden        | Matches `inventory.png`                                                         |
| VIS-02 | P    | Cart with the Backpack, full page               | Matches `cart.png`                                                              |
| VIS-03 | N    | visual_user's inventory, prices hidden the same way | `test.fail`: differs from `inventory.png`. Skipped while snapshots are written, so it can't overwrite the baseline |

### 6.8 Accessibility (`tests/a11y/`)

The gate is axe's WCAG 2.0, 2.1 and 2.2 rules at levels A and AA, with zero violations allowed. Best-practice rules are not gated (see README).

| ID      | Type | Scenario                                      | Expected result               |
|---------|------|-----------------------------------------------|-------------------------------|
| A11Y-01 | P    | Login page showing an error                   | No violations                 |
| A11Y-02 | P    | Inventory page                                | No violations                 |
| A11Y-03 | P    | Inventory with the burger menu open           | No violations                 |
| A11Y-04 | P    | Product detail page                           | No violations                 |
| A11Y-05 | P    | Cart with one item                            | No violations                 |
| A11Y-06 | P    | Checkout step one showing an error            | No violations                 |
| A11Y-07 | P    | Checkout overview                             | No violations                 |
| A11Y-08 | P    | Order complete page                           | No violations                 |
| A11Y-09 | N    | An image without alt text is planted          | `image-alt` is reported, proving the gate can fail |

### 6.9 Mobile viewport (`tests/mobile/`)

The `mobile-chrome` project (Pixel 7) runs the whole suite. These two tests prove it really renders the phone layout.

| ID     | Type | Scenario                         | Expected result                                  |
|--------|------|----------------------------------|--------------------------------------------------|
| MOB-01 | P    | Inventory on `mobile-chrome`     | Mobile device, viewport under 500 px, products in one column. Skipped on the other projects |
| MOB-02 | P    | Inventory on desktop             | Products in two columns. Skipped on the phone    |

### Coverage summary

Per browser, counted from `npx playwright test --list --reporter=line` (the Allure reporter would replace your last results with "skipped" ones).

| Area           | Positive | Negative | Total |
|----------------|----------|----------|-------|
| Authentication | 3        | 6        | 9     |
| Products       | 10       | 2        | 12    |
| Cart           | 9        | 1        | 10    |
| Checkout       | 8        | 6        | 14    |
| Console errors | 2        | 5        | 7     |
| Visual         | 2        | 1        | 3     |
| Accessibility  | 8        | 1        | 9     |
| Mobile layout  | 2        | 0        | 2     |
| E2E            | 1        | 0        | 1     |
| **Total**      | **45**   | **22**   | **67**|

Each of the four projects (Chromium, Firefox, WebKit, Pixel 7) runs all 67. MOB-01 and MOB-02 each skip on the other layout.

---

## 7. Configuration

### 7.1 `playwright.config.ts` (target shape)

```ts
import dotenv from 'dotenv';
import { defineConfig, devices } from '@playwright/test';

dotenv.config({ quiet: true });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  failOnFlakyTests: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['./reporters/allure.ts', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
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
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/standard.json',
        // Keeps a trace of a failing first attempt; see section 11 point 4.
        trace: 'retain-on-failure-and-retries',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], storageState: '.auth/standard.json' },
      dependencies: ['setup'],
    },
  ],
});
```

CI merges the shards with `playwright.merge.config.ts`, which lists the HTML reporter and the same `reporters/allure.ts`.

### 7.2 `.env.example`

```
BASE_URL=https://www.saucedemo.com
STANDARD_USER=standard_user
LOCKED_OUT_USER=locked_out_user
PROBLEM_USER=problem_user
PERFORMANCE_GLITCH_USER=performance_glitch_user
ERROR_USER=error_user
VISUAL_USER=visual_user
PASSWORD=secret_sauce
```

### 7.3 npm scripts

```json
{
  "scripts": {
    "test": "playwright test",
    "test:chromium": "playwright test --project=chromium",
    "test:all-browsers": "playwright test --project=chromium --project=firefox --project=webkit",
    "test:mobile": "playwright test --project=mobile-chrome",
    "test:visual:update-linux": "node scripts/update-linux-snapshots.js",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:negative": "playwright test --grep @negative",
    "test:headed": "playwright test --headed --project=chromium",
    "test:debug": "playwright test --debug --project=chromium",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report",
    "report:allure": "allure generate allure-results",
    "codegen": "playwright codegen https://www.saucedemo.com",
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc -p ."
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
allure-results/
allure-report/
allure-history/
```

---

## 8. Implementation phases

Each phase is roughly one focused session of 2–4 hours. Do them in order; later phases assume earlier ones.

Phases 1 to 9 were built in JavaScript. The TypeScript migration (Phase 8's stretch table) renamed every file, so the file names below use `.ts`, as they are today.

### Phase 1 — Scaffold and first test

**Goal:** A running Playwright project with one honest test and the HTML report open in a browser.

Tasks:
1. `cd shopflow && npm init playwright@latest` — choose JavaScript, `tests` folder, add GitHub Actions workflow, install browsers.
2. Delete the example specs. Install `dotenv`. Create `.env` from `.env.example`.
3. Write `playwright.config.ts` as in section 7.1 but with only the `chromium` project and no `setup` yet.
4. Write `tests/auth/login.positive.spec.ts` with **no page objects**: fill username, fill password, click, `expect(page).toHaveURL(/inventory/)`.
5. Run `npx playwright test`, then `npx playwright show-report`.
6. Deliberately break the test, re-run, open the trace.

Done when: test passes, you have opened the trace viewer at least once.

Concepts to explain: auto-waiting, web-first assertions (`expect(locator).toBeVisible()` retries, `expect(await locator.isVisible())` does not), trace viewer, `baseURL`.

### Phase 2 — Page Object Model

**Goal:** The login test rewritten over page objects, and the first inventory test.

Tasks:
1. Create `pages/BasePage.ts`, `pages/LoginPage.ts`, `pages/InventoryPage.ts`.
2. Refactor the Phase 1 test to use `LoginPage` and `InventoryPage`.
3. Add `components/HeaderComponent.ts` with cart badge and menu locators; compose it into `InventoryPage`.
4. Write PROD-01 (six products listed).
5. Write a short `README.md` with install and run instructions.

Done when: no `page.getBy…` calls remain inside spec files.

Concepts to explain: why POM, what belongs in a page vs a test, composition over inheritance for shared components, returning the next page from actions.

### Phase 3 — Authentication suite

**Goal:** AUTH-01 to AUTH-09 passing.

Tasks:
1. Create `data/users.ts`.
2. Write `login.negative.spec.ts` with a data-driven loop for AUTH-04 to AUTH-06.
3. Add AUTH-03, AUTH-07, AUTH-08.
4. Add AUTH-02 logout using `HeaderComponent`.
5. Add AUTH-09 with `performance_glitch_user` and observe that auto-wait handles it with no sleeps.
6. Add `@smoke` and `@negative` tags and the matching npm scripts.

Done when: `npm run test:negative` runs only negative tests and all pass.

Concepts to explain: `test.describe`, data-driven tests via `for…of` over cases, `test.step` for readable reports, tags and `--grep`.

### Phase 4 — Fixtures and authentication state

**Goal:** Tests outside `auth/` never see the login page.

Tasks:
1. Create `fixtures/pages.fixture.ts` exporting extended `test` and `expect`.
2. Migrate every spec to import from the fixture.
3. Create `tests/auth.setup.ts` that logs in and calls `page.context().storageState({ path: '.auth/standard.json' })`.
4. Add the `setup` project and `dependencies` to the config; add `.auth/` to `.gitignore`.
5. In `tests/auth/*.spec.ts`, add `test.use({ storageState: { cookies: [], origins: [] } })`.
6. Rewrite PROD-01 to start at `inventoryPage.goto()` directly.

Done when: running only `products/inventory.spec.ts` shows the setup project run once, then the test starts on the inventory page.

Concepts to explain: fixtures vs `beforeEach`, fixture scopes (test vs worker), `storageState`, project dependencies, why this makes suites faster and less flaky.

### Phase 5 — Products and cart

**Goal:** PROD-02 to PROD-10 and CART-01 to CART-10 passing.

Tasks:
1. Create `data/products.ts` and `utils/price.ts`.
2. Implement sorting tests PROD-02 to PROD-05 by reading all names/prices with `allTextContents()` and comparing to a sorted copy.
3. Create `pages/ProductDetailPage.ts`; implement PROD-06 to PROD-08.
4. Create `pages/CartPage.ts`; implement CART-01 to CART-10.
5. Add a `problem_user` describe block with `test.fail()` for PROD-09 and PROD-10, documenting the known bugs in comments.

Done when: all product and cart tests pass on Chromium, and the two `test.fail` tests are reported as "expected failure", not as passes (checked in JSON output; the terminal shows ✘ and counts them as passed).

Concepts to explain: `locator.all()` vs `allTextContents()`, `nth()`, `filter({ hasText })`, `test.fail` vs `test.skip` vs `test.fixme`, asserting on sorted arrays.

### Phase 6 — Checkout

**Goal:** CHK-01 to CHK-14 and E2E-01 passing.

Tasks:
1. Create `pages/CheckoutInfoPage.ts`, `CheckoutOverviewPage.ts`, `CheckoutCompletePage.ts`.
2. Create `data/checkout.data.ts` with `validCustomer` and `invalidCustomers`.
3. Implement positive tests CHK-01 to CHK-08, computing expected totals from `data/products.ts` and `utils/price.ts`.
4. Implement data-driven CHK-09 to CHK-12.
5. Implement CHK-13: run it once manually, record what SauceDemo actually does, and assert that behaviour.
6. Write `tests/e2e/purchase-journey.spec.ts` using `test.step` for each stage.

Done when: `npm run test:smoke` runs AUTH-01, PROD-01, CART-01, CHK-01, E2E-01 and passes in under a minute.

Concepts to explain: `test.step` and how it appears in the HTML report, floating-point rounding in money assertions, chaining page objects across a multi-page flow.

### Phase 7 — Reporting, cross-browser, CI, code quality

**Goal:** A green GitHub Actions badge and a downloadable HTML report on every push.

Tasks:
1. Enable `firefox` and `webkit` projects. Fix any browser-specific failures (expect at least one).
2. Confirm `screenshot`, `video`, `trace` settings behave as intended by forcing a failure.
3. Finalise `.github/workflows/playwright.yml`: checkout, setup-node, `npm ci`, `npx playwright install --with-deps`, `npx playwright test`, `actions/upload-artifact` for `playwright-report/` with `if: ${{ !cancelled() }}`, so the report is uploaded after failures but not after a cancelled run.
4. Add ESLint (`eslint-plugin-playwright`) and Prettier. Fix lint findings. Add a `lint` job to CI.
5. Set `retries: 2` in CI and deliberately introduce one flaky test to watch retry behaviour, then remove it.
6. Initialise git if not already done, push to GitHub, add the workflow badge to `README.md`.

Done when: a push triggers the workflow, it passes, and the HTML report is downloadable from the run.

Concepts to explain: workers and parallelism, sharding, retries and flaky-test policy, `forbidOnly`, why `--with-deps`, artifact retention.

### Phase 8 — Stretch goals

Pick any, in any order, once Phases 1–7 are done.

| Goal                        | What you build                                                                                     | Concept learned                          |
|-----------------------------|----------------------------------------------------------------------------------------------------|------------------------------------------|
| Visual regression (done)    | `toHaveScreenshot()` on inventory and cart pages; run with `visual_user` and watch it fail. Baselines per OS, Linux ones made in Playwright's Docker image, which CI runs in | Snapshot management, `--update-snapshots`|
| Console error detection (done) | Automatic fixture that collects `page.on('console')` errors and `page.on('pageerror')` exceptions and fails the test if any; run with `error_user`. `pageerror` is needed because most of `error_user`'s failures are uncaught exceptions | Event listeners, custom fixtures |
| Accessibility checks (done) | `@axe-core/playwright` scan on each page, gated on WCAG A/AA rules                                 | Automated a11y                           |
| Mobile viewport (done)      | Add `Pixel 7` project. `HeaderComponent` turned out to need no change: the menu's markup is the same on mobile | Device emulation                 |
| Sharding in CI (done)       | Matrix strategy with `--shard=1/3`, merge with `merge-reports`. With three projects of equal size, each shard turns out to be one browser | Blob reporter, scaling |
| Allure or Monocart reporter (done: Allure 3) | Second reporter with history and trends; CI keeps the history in the Actions cache | Reporter plugins                         |
| TypeScript migration (done, Phase 10) | Every file but the ESLint config, the Docker script and `allurerc.mjs` renamed to `.ts`; typed page objects, fixtures and test data; strict `tsconfig`; `tsc` and type-aware ESLint in CI, so a missing `await` fails lint | Type safety in test code, typed fixtures |
| Second target app           | Point the same framework at automationexercise.com with registration flows                         | Framework reuse, abstraction quality     |

---

## 9. Conventions

**Naming**
- Spec files: `<feature>.<positive|negative>.spec.ts` or `<feature>.spec.ts`.
- Page classes: `PascalCasePage.ts`, exported as a named export, with `readonly` locator fields.
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

Checked on 2026-11-03 (Phase 9), with the evidence for each item.

- [x] All scenarios in section 6 implemented and passing on Chromium, Firefox, WebKit, and also Pixel 7. The original list had 44; the suite has grown to 67 tests per project. A full local run gives 264 passed and 5 skipped (the skips are by design).
- [x] `test.fail` tests report as expected failures, not passes: 5 per project (PROD-09, PROD-10, CHK-14, CON-03, VIS-03). Each goes red with "Expected to fail, but passed" if its bug disappears; checked for CON-03, VIS-03 and A11Y-09's planted case.
- [x] Zero `waitForTimeout` calls in the repo (grep over all `.ts` and `.js` outside `node_modules` and `docs`). Lint also enforces it.
- [x] Zero locator strings inside spec files (grep for `getByTestId`, `getByRole`, `getByText`, `locator(`). Two exceptions by design: A11Y-09's planted image in `page.evaluate`, and `tests/visual/hide-prices.css`, which isn't a spec.
- [x] `npm run test:smoke` completes in under 60 seconds locally: 21 tests in 14.9 s on all four projects.
- [x] GitHub Actions passes on `main` and uploads the HTML report, plus the Allure report.
- [x] ESLint and Prettier pass, in CI's `lint` job and locally. Since Phase 10, `tsc` passes there too.
- [x] `README.md` lets a stranger clone, install, and run tests in under five minutes: a fresh clone through `npm install`, `npx playwright install`, `.env` and `npm run test:smoke` took 31 s. Browsers were already cached on that machine; a first-ever download adds a few minutes, depending on bandwidth.
- [ ] You can answer every "Concepts to explain" item in section 8 without notes. Only you can tick this one.

---

## 11. Interview talking points

When this project comes up, be ready to speak to:

1. **Why Playwright over Selenium or Cypress.** Auto-waiting, multi-browser including WebKit, built-in test runner, trace viewer, first-class fixtures.
2. **How the framework is structured and why.** POM for maintainability, fixtures for dependency injection, data files for separation of data from logic, components for shared UI.
3. **How you handle authentication.** `storageState` via a setup project; auth tests opt out.
4. **How you handle flakiness.** No hard waits, web-first assertions, retries only in CI, traces on first retry so flaky failures are diagnosable. Two real examples from enabling Firefox and WebKit: a click on the burger menu just before the app hides the menu leaves it open but not displayed, fixed by waiting for that condition rather than sleeping; and on WebKit under load, `fill()` can succeed with no text arriving, fixed by reading the field back and refilling once. CI enforces the policy: a test that only passes on retry fails the run, so a flake can't hide behind a green badge. The trade-off is that a brief outage on the site under test can also turn it red. Evidence before fixes: when a WebKit click was lost once on CI, the failing attempt had no trace, so WebKit now keeps one. Tracing every run in all browsers was tried first and made Firefox clicks stall locally (2 of 4 full runs failed, against 3 of 3 clean without it), so it's limited to WebKit. That WebKit trace paid off: a later CI flake turned out to be SauceDemo's third-party telemetry answering 502, which WebKit reports as CORS errors that don't name the URL. Instead of widening the console filter, the tests now answer that telemetry locally, so they no longer depend on someone else's service.
5. **How negative tests are organised.** Data-driven loops over invalid cases; `test.fail` for known app bugs so they are tracked, not hidden.
6. **What the reports show.** HTML report with steps, screenshots, videos, and traces attached to failures; uploaded as CI artifacts. An Allure report alongside it, with trends: CI restores the previous runs' history from the Actions cache before generating it. Getting Allure to work with sharding meant reading the reporter's source: in merge mode it crashed on an empty project list and turned the merge red, so a small subclass guards that one call.
7. **One concrete bug you found.** The checkout item total shows a raw float such as `$59.980000000000004` for 18 of the 63 possible carts, even for `standard_user`; or `problem_user` sorting or images. Explain how the test exposes it.
8. **Visual regression.** Screenshots differ between operating systems, so baselines are kept per OS. The Linux ones are made in Playwright's Docker image, and CI runs in that same image, so they match pixel for pixel. `visual_user` is the planted failure. Its prices are random on every load, so both sides hide them with the same stylesheet. A review caught that the first version masked them only in the new screenshot, which made the expected failure guaranteed. Now the same test logged in as `standard_user` goes red with "Expected to fail, but passed". Its test shares the real baseline, so it skips itself while snapshots are being written; otherwise `--update-snapshots` would replace the good baseline with the broken page (that happened once during recon).
9. **Accessibility.** axe scans 8 page states against WCAG A/AA rules, with zero violations allowed. SauceDemo passes, so a planted image without alt text proves the gate can fail. Best-practice findings, such as no `h1` on any page, are documented rather than gated.
10. **Mobile.** A Pixel 7 project runs the whole suite. The plan expected the header to need changes for mobile, but recon showed the same markup, so none were made. Two layout tests prove the project really renders the phone layout.
11. **TypeScript.** Migrated after the JavaScript suite was complete. Playwright runs `.ts` directly, so `tsc` only checks types. The payoff was concrete: type-aware lint now fails a page-object call missing its `await`, and the migration itself found a config pattern still matching `.setup.js`, which silently skipped login and failed 203 tests.

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
npm run typecheck               # tsc, no output files
```
