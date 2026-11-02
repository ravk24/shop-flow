# ShopFlow

[![Playwright Tests](https://github.com/ravk24/shop-flow/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/ravk24/shop-flow/actions/workflows/playwright.yml)

End-to-end test automation framework for the [SauceDemo](https://www.saucedemo.com) e-commerce site, built with [Playwright](https://playwright.dev) and JavaScript. It covers authentication, product listing, cart and checkout flows using the Page Object Model, on Chromium, Firefox and WebKit.

The full design, test scenarios and phase-by-phase roadmap live in [PROJECT_PLAN.md](PROJECT_PLAN.md).

## Prerequisites

- Node.js 20 or newer (developed on Node 24)
- Git

## Install

```bash
git clone <this-repo> shop-flow
cd shop-flow
npm install
npx playwright install
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

The `.env` file holds the public SauceDemo credentials and the base URL. The defaults work as-is.

## Run

| Command                | What it does                                   |
|------------------------|------------------------------------------------|
| `npm test`             | Run the whole suite headless on all three browsers |
| `npm run test:all-browsers` | Same, naming the three browsers explicitly |
| `npm run test:chromium` | Run on Chromium only, the fast local loop     |
| `npm run test:smoke`   | Run only tests tagged `@smoke`                 |
| `npm run test:regression` | Run tests tagged `@regression` (includes the smoke tests) |
| `npm run test:negative` | Run only tests tagged `@negative`             |
| `npm run test:headed`  | Run with a visible browser                     |
| `npm run test:ui`      | Open Playwright UI mode                        |
| `npm run test:debug`   | Step through with the Playwright Inspector     |
| `npm run report`       | Open the last HTML report                      |
| `npm run codegen`      | Record locators against SauceDemo              |
| `npm run lint`         | Run ESLint; warnings fail too                  |
| `npm run format`       | Format the code with Prettier                  |
| `npm run format:check` | Check formatting without changing files        |

For the quickest full health check, run `npx playwright test tests/e2e`. It's one test that goes from login through to a completed order.

Failures attach a screenshot and video to the HTML report. To capture a trace for a local failure, run `npx playwright test --trace on` and open it with `npx playwright show-trace <path-to-trace.zip>`.

## Authentication state

A `setup` project (`tests/auth.setup.js`) logs in once per run and saves the session to `.auth/standard.json`. That file is generated and git-ignored. Tests then load it and start already logged in, except `tests/auth/*.spec.js`, which opt out because they test logging in.

- SauceDemo's login cookie expires after 10 minutes, so a saved file goes stale. Normal runs create a new one, but a run with `--no-deps` reuses whatever is there.
- `npm run test:ui` lists `setup` as a separate project. Run it first, and again once the state has expired.
- `npm run test:debug` also pauses on the setup test before reaching yours.

## Known app bugs

Three tests assert the correct behaviour and are marked with `test.fail()`, so these bugs stay tracked:

- `problem_user` has broken sorting and broken product images, on purpose.
- The checkout overview shows the item total as a raw float for 18 of the 63 possible carts, for example `Item total: $59.980000000000004`. This one affects the normal `standard_user`. It isn't known whether SauceDemo intends it.

How they behave in a run:

- These three tests show `✘` in the list output but count as passed, and the run still exits 0.
- If any of the bugs is ever fixed, the test reports `Expected to fail, but passed.` and the run goes red, which is the cue to remove `test.fail()`.

## Console errors

Every test fails at the end if the page logged a `console.error` or threw an uncaught exception, through an automatic fixture in `fixtures/pages.fixture.js`. Uncaught exceptions matter most here: nearly all of `error_user`'s failures arrive that way, not through the console.

- **Ignored on purpose (`utils/console.js`):** SauceDemo's telemetry getting a 401 from `events.backtrace.io`, and the 404 status its server gives a direct visit to any `.html` page. If new noise appears, read it before adding it to this list.
- **To read errors in a test instead of failing on them:** use `test.use({ failOnConsoleErrors: false })` and assert on the `consoleErrors` fixture.
- **What it doesn't catch:** `alert`s (such as `error_user`'s "Sorting is broken!"), errors after a test's last action, and pages other than the test's own `page`. Firefox doesn't log failed resources to the console, so a missing asset is only caught on Chromium and WebKit.

## Browser notes

Two timing failures only appeared once Firefox and WebKit were enabled. Both are handled in the page objects, not with sleeps or retries:

- **Burger menu:** the app hides the menu about half a second after load, and a click just before that leaves it open but not displayed. `HeaderComponent.openMenu()` waits for the logout link to go hidden before clicking.
- **Dropped text on WebKit:** under load, `fill()` can succeed with no text arriving in the field. `CheckoutInfoPage.fillField()` reads the value back and refills once. A value that's still wrong fails the test's own assertions. The trade-off is that a real Safari problem of this exact kind wouldn't be reported. It isn't established whether the fault is in WebKit or Playwright.

## CI

GitHub Actions runs these jobs on every push and on pull requests to `main`:

- `test` runs the suite in three shards, as separate jobs, each with 2 workers and up to 2 retries. With today's test order, each shard turns out to be one browser: Chromium, Firefox, WebKit. This doesn't make runs meaningfully faster, because a run takes as long as its slowest shard, but a browser-specific failure is visible at a glance.
- `merge-reports` combines the three shards' blob reports into one HTML report, even if a shard failed.
- `lint` runs ESLint and the Prettier check, so a style failure is reported apart from a test failure.

A test that only passes on retry is reported as `flaky` and fails the run, because a flaky result means there's a real problem to fix.

To download the HTML report, open a run in the [Actions tab](https://github.com/ravk24/shop-flow/actions) and find the `playwright-report` artifact. It's uploaded after failures too, and kept for 30 days.

## Project layout

```
pages/        Page objects: one class per page, locators and actions only
components/   Shared UI such as the header (cart badge, burger menu)
fixtures/     Extends Playwright's test so specs receive page objects ready-made
data/         Test data such as user credentials and products
utils/        Small helpers such as price parsing and the console noise filter
tests/        Specs grouped by feature; tests own the assertions
docs/         Design and implementation plans
```
