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

## CI

GitHub Actions runs two jobs on every push and on pull requests to `main`:

- `test` installs all three browsers with their system dependencies and runs the whole suite, with 2 workers and up to 2 retries.
- `lint` runs ESLint and the Prettier check, so a style failure is reported apart from a test failure.

To download the HTML report, open a run in the [Actions tab](https://github.com/ravk24/shop-flow/actions) and find the `playwright-report` artifact. It's uploaded after failures too, and kept for 30 days.

## Project layout

```
pages/        Page objects: one class per page, locators and actions only
components/   Shared UI such as the header (cart badge, burger menu)
fixtures/     Extends Playwright's test so specs receive page objects ready-made
data/         Test data such as user credentials and products
utils/        Small helpers such as price parsing
tests/        Specs grouped by feature; tests own the assertions
docs/         Design and implementation plans
```
