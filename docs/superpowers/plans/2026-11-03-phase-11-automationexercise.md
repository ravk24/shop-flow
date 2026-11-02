# ShopFlow Phase 11 — Second Target App (automationexercise.com): Implementation Plan

> Executed inline with superpowers:executing-plans, then one fresh whole-branch review. The user pre-approved the remaining phases and told me to follow my own recommendation on every decision without asking (2026-11-03). The rulings below are those recommendations.

**Goal:** Point the same framework at a second e-commerce site, reusing `BasePage`, the console-error gate, the axe fixture and the page-object and fixture patterns, without touching how the SauceDemo suite runs or reports.

**Spec:** `PROJECT_PLAN.md` §8 stretch row "Second target app: point the same framework at automationexercise.com with registration flows".

## Recon (2026-11-02 and 2026-11-03, Chromium, ads blocked)

| Question | Observed | Consequence |
|---|---|---|
| Products | `/products`: heading `ALL PRODUCTS`, 34 cards (`.features_items .product-image-wrapper`), name in `.productinfo p`, price in `.productinfo h2` | AE-01 |
| Search | `#search_product` + `#submit_search` → `/products?search=Top`, heading `SEARCHED PRODUCTS`, 14 cards; the search matches categories too (`Little Girls Mr. Panda Shirt` is a result). No match: same heading, 0 cards | AE-02, AE-03 |
| Product detail | `/product_details/1`: `Blue Top`, `Category: Women > Tops`, `Rs. 500`, `Brand: Polo`, `#quantity`, one `Add to cart` button | AE-04 |
| Add to cart | The `#cartModal` is always in the DOM; it becomes visible about 1.4 s after the click, title `Added!`, link `View Cart`. Navigating before that loses the add | Wait for the modal, never for the click |
| Cart | Server-side, keyed on a `sessionid` cookie, so each test's fresh context starts empty. Row `tr#product-1`: quantity `3`, total `Rs. 1500`; `.cart_quantity_delete` removes it, then `#empty_cart` shows `Cart is empty!` | AE-05 to AE-07 |
| Login | `data-qa` attributes on the login and signup forms only. An unknown address gets `Your email or password is incorrect!` and stays on `/login` | AE-08; `testIdAttribute: 'data-qa'` |
| Console | Every page logs 3 `Mixed Content` errors for `http://fonts.googleapis.com` stylesheets. Each aborted ad request logs `Failed to load resource: net::ERR_FAILED` with the ad URL as its location | A narrow noise filter for exactly these two |
| Ads | googlesyndication, doubleclick, adtrafficquality, fundingchoices, cloudflareinsights | Abort with `page.route` in an automatic fixture |
| axe (WCAG A/AA) | Violations on every page checked: `button-name` (1–2), `color-contrast` (1–35), `label` (1, detail page) | AE-09 is a `test.fail` known-bug test |
| Load | Sometimes answers 503 "This website is under heavy load (queue full)" | `goto` fails with a clear "site overloaded" message |

## Rulings

1. **No account creation or form submission that changes data.** Registration is the spec's headline flow, but it creates and deletes a real account on someone else's site; the auto-mode classifier denied it during recon. It needs the user's explicit permission, so it's deferred, not faked. A failed login with a made-up `.invalid` address creates nothing and is in scope.
2. **A separate config, `playwright.automationexercise.config.ts`, not a fifth project.** CI shards the main config by project; a fifth project would land in a shard and make SauceDemo's blocking job depend on a third-party site. `npm test` stays SauceDemo-only; `npm run test:automationexercise` runs this suite.
3. **Chromium only, 2 workers everywhere.** The aim is framework reuse, not browser coverage; 2 workers keeps the load on a public, sometimes overloaded site polite.
4. **A non-blocking CI job (`continue-on-error: true`)** in the same Playwright image, uploading its own HTML report. Its result is visible on every run but can't redden the badge.
5. **Reuse, not copy:** page objects extend `BasePage` through a small `AutomationExercisePage` whose `goto` checks the response status; the console gate becomes one shared helper, `watchPageErrors(page, isNoise)`, used by both fixtures; the axe builder uses the same `WCAG_TAGS`.
6. **`expect` timeout 10 s for this suite.** A third-party site over the public internet; the add-to-cart modal alone takes about 1.4 s.
7. **Exact counts (34 products, 14 results).** Same policy as SauceDemo: a changed catalogue should be noticed, and the job can't block anyone.
8. **Folders:** `pages/automationexercise/`, `fixtures/automationexercise.fixture.ts`, `data/automationexercise.data.ts`, `tests-automationexercise/`. The SauceDemo `testDir` (`./tests`) never sees these specs.

## Tasks

1. **Shared helpers:** move the console listener into `watchPageErrors(page: Page, isNoise: (text: string, url: string) => boolean): string[]` in `utils/console.ts`; the SauceDemo fixture uses it with `isKnownNoise`. Add `AD_HOSTS: RegExp` and `isAutomationExerciseNoise(text, url)`. Verify: full SauceDemo suite unchanged (264 passed, 5 skipped).
2. **Page objects** (`AutomationExercisePage`, `AeProductsPage`, `AeProductDetailPage`, `AeCartPage`, `AeLoginPage`), data file, fixture (`blockAds` and `consoleErrors` automatic, `makeAxeBuilder`, page objects, `failOnConsoleErrors` option) and config.
3. **Specs**, all tagged `@regression`, AE-01 and AE-05 also `@smoke`:
   - AE-01 lists all 34 products under `ALL PRODUCTS`
   - AE-02 search `Top` gives `SEARCHED PRODUCTS` with 14 results, including `Blue Top`
   - AE-03 a search with no match shows no products `@negative`
   - AE-04 the detail page shows name, category, price and brand
   - AE-05 adding quantity 3 from the detail page puts one row in the cart at `Rs. 1500`
   - AE-06 deleting the only row shows `Cart is empty!`
   - AE-07 a new visitor's cart is empty
   - AE-08 login with an unknown address is rejected `@negative`
   - AE-09 the login page has no WCAG A/AA violations — `test.fail`, known violations listed
   - AE-10 `goto` reports an overloaded site when the server answers 503 `@negative` (routed locally, no load on the site)
4. **Tooling and CI:** npm script, lint coverage for the new spec folder, ignore the new report folder, the CI job.
5. **Docs:** README section, `PROJECT_PLAN.md` §4 tree, §8 row, §11 talking point.

Each test must be seen failing for the right reason once: AE-10 with the status check removed; AE-09 by its `test.fail` reporting; the noise filter by a test page whose console error is not noise.

## Findings and rulings during execution

- **Headings are styled uppercase.** Their text is `All Products` and `Searched Products`; the browser only displays them in capitals. `toHaveText` reads the text, so the specs use the real casing.
- **A delete click before the cart page's load event does nothing.** `toHaveURL` passed on commit, the click landed before the page's script bound its handler, and the row stayed. `viewCart()` now waits for the cart page to load (`waitForURL`, which waits for `load`). Also, `#empty_cart` is always in the DOM, so the specs assert it's visible before reading its text.
- **Ruling 9: filter the site's own 502/503 loads.** In 66 runs, 2 failed the console gate on a 502 or 503 for one of the site's product pictures. That's the same load shedding `goto` reports for whole pages. `isAutomationExerciseNoise` drops 502 and 503 from `https://automationexercise.com/` only; a 404 there still fails. Cost if wrong: a real 502/503 bug on the site's own resources goes unreported by this suite.
- **Ruling 10: failed-load errors now carry their URL,** in both apps (`watchPageErrors`). The browser's text, "Failed to load resource: … status of 502 ()", doesn't say what failed. Only messages starting with "Failed to load resource" change; SauceDemo's console tests match those by substring and still pass.
- **AE-10 became three framework checks:** a routed 503 page, a planted console error, and a routed 404 picture next to a routed 503 one. That makes 12 tests.

## Results

- Mutations, each red on the expected test: the status check disabled (503 test); the filter returning `true` (planted-error and 404 tests); the shedding filter widened to any status (404 test).
- AE-09's expected failure is for the right reason: `button-name: #subscribe` and `color-contrast`.
- automationexercise: 12 passed (22 s). SauceDemo, unchanged: 264 passed, 5 skipped. `tsc`, lint and Prettier clean.

## Review Focus

- The site answers 503 mid-run: the failure must name the overload, not a locator timeout.
- An ad host not in the list starts loading: its console errors must fail the test, not be swallowed by the filter.
- The add-to-cart click returns before the modal: no test may navigate before the modal is visible.
- The SauceDemo suite and its CI shards must be byte-for-byte unaffected in what they run.
