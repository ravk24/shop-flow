# ShopFlow

End-to-end test automation framework for the [SauceDemo](https://www.saucedemo.com) e-commerce site, built with [Playwright](https://playwright.dev) and JavaScript. It is being built phase by phase to cover authentication, product listing, cart and checkout flows using the Page Object Model.

The full design, test scenarios and phase-by-phase roadmap live in [PROJECT_PLAN.md](PROJECT_PLAN.md).

## Prerequisites

- Node.js 20 or newer (developed on Node 24)
- Git

## Install

```bash
git clone <this-repo> shop-flow
cd shop-flow
npm install
npx playwright install chromium
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

The `.env` file holds the public SauceDemo credentials and the base URL. The defaults work as-is.

## Run

| Command                | What it does                                   |
|------------------------|------------------------------------------------|
| `npm test`             | Run the whole suite headless on Chromium       |
| `npm run test:smoke`   | Run only tests tagged `@smoke`                 |
| `npm run test:regression` | Run tests tagged `@regression` (includes the smoke tests) |
| `npm run test:negative` | Run only tests tagged `@negative`             |
| `npm run test:headed`  | Run with a visible browser                     |
| `npm run test:ui`      | Open Playwright UI mode                        |
| `npm run test:debug`   | Step through with the Playwright Inspector     |
| `npm run report`       | Open the last HTML report                      |
| `npm run codegen`      | Record locators against SauceDemo              |

Failures attach a screenshot and video to the HTML report. To capture a trace for a local failure, run `npx playwright test --trace on` and open it with `npx playwright show-trace <path-to-trace.zip>`.

## Authentication state

A `setup` project (`tests/auth.setup.js`) logs in once per run and saves the session to `.auth/standard.json`. That file is generated and git-ignored. Tests then load it and start already logged in, except `tests/auth/*.spec.js`, which opt out because they test logging in.

- SauceDemo's login cookie expires after 10 minutes, so a saved file goes stale. Normal runs create a new one, but a run with `--no-deps` reuses whatever is there.
- `npm run test:ui` lists `setup` as a separate project. Run it first, and again once the state has expired.
- `npm run test:debug` also pauses on the setup test before reaching yours.

## Known app bugs

SauceDemo's `problem_user` has broken sorting and broken product images on purpose. Two tests assert the correct behaviour and are marked with `test.fail()`, so the bugs stay tracked.

- These two tests show `✘` in the list output but count as passed, and the run still exits 0.
- If either bug is ever fixed, the test reports `Expected to fail, but passed.` and the run goes red, which is the cue to remove `test.fail()`.

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
