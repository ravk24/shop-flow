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
| `npm run test:regression` | Run tests tagged `@regression` (excludes `@smoke`) |
| `npm run test:negative` | Run only tests tagged `@negative`             |
| `npm run test:headed`  | Run with a visible browser                     |
| `npm run test:ui`      | Open Playwright UI mode                        |
| `npm run test:debug`   | Step through with the Playwright Inspector     |
| `npm run report`       | Open the last HTML report                      |
| `npm run codegen`      | Record locators against SauceDemo              |

Failures attach a screenshot and video to the HTML report. To capture a trace for a local failure, run `npx playwright test --trace on` and open it with `npx playwright show-trace <path-to-trace.zip>`.

## Project layout

```
pages/        Page objects: one class per page, locators and actions only
components/   Shared UI such as the header (cart badge, burger menu)
tests/        Specs grouped by feature; tests own the assertions
docs/         Design and implementation plans
```
