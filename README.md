# ShopFlow

[![Playwright Tests](https://github.com/ravk24/shop-flow/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/ravk24/shop-flow/actions/workflows/playwright.yml)

End-to-end test automation framework for the [SauceDemo](https://www.saucedemo.com) e-commerce site, built with [Playwright](https://playwright.dev) and TypeScript. It covers authentication, product listing, cart and checkout flows using the Page Object Model, on Chromium, Firefox, WebKit and an emulated Pixel 7, with visual regression, accessibility scans, console error detection and an Allure report.

The full design, test scenarios and phase-by-phase roadmap live in [PROJECT_PLAN.md](PROJECT_PLAN.md).

## Prerequisites

- Node.js 20.19+ on the 20 line, 22.13+ on the 22 line, or 24+ (ESLint 10 needs one of these; developed on Node 24)
- Git

## Install

```bash
git clone <this-repo> shop-flow
cd shop-flow
npm install
npx playwright install      # on Linux: npx playwright install --with-deps, for the system libraries WebKit needs
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

The `.env` file holds the public SauceDemo credentials and the base URL. The defaults work as-is.

## Run

| Command                | What it does                                   |
|------------------------|------------------------------------------------|
| `npm test`             | Run the whole suite headless on all four projects |
| `npm run test:all-browsers` | Run on the three desktop browsers only    |
| `npm run test:chromium` | Run on Chromium only, the fast local loop     |
| `npm run test:mobile`  | Run on the emulated Pixel 7 only               |
| `npm run test:visual:update-linux` | Regenerate the Linux screenshot baselines in Docker |
| `npm run test:smoke`   | Run only tests tagged `@smoke`                 |
| `npm run test:regression` | Run tests tagged `@regression` (includes the smoke tests) |
| `npm run test:negative` | Run only tests tagged `@negative`             |
| `npm run test:headed`  | Run with a visible browser                     |
| `npm run test:ui`      | Open Playwright UI mode                        |
| `npm run test:debug`   | Step through with the Playwright Inspector     |
| `npm run report`       | Open the last HTML report                      |
| `npm run report:allure` | Build the Allure report from the last run into `allure-report/index.html` |
| `npm run codegen`      | Record locators against SauceDemo              |
| `npm run typecheck`    | Type-check with `tsc` (writes no files)        |
| `npm run lint`         | Run ESLint, type-aware; warnings fail too      |
| `npm run format`       | Format the code with Prettier                  |
| `npm run format:check` | Check formatting without changing files        |

For the quickest full health check, run `npx playwright test tests/e2e`. It's one test that goes from login through to a completed order.

Failures attach a screenshot and video to the HTML report. A retry also gets a trace, and on WebKit a failing first attempt keeps one too, to diagnose a rare lost click. To capture a trace for a local failure, run `npx playwright test --trace on` and open it with `npx playwright show-trace <path-to-trace.zip>`.

## Authentication state

A `setup` project (`tests/auth.setup.ts`) logs in once per run and saves the session to `.auth/standard.json`. That file is generated and git-ignored. Tests then load it and start already logged in, except `tests/auth/*.spec.ts`, which opt out because they test logging in.

- SauceDemo's login cookie expires after 10 minutes, so a saved file goes stale. Normal runs create a new one, but a run with `--no-deps` reuses whatever is there.
- `npm run test:ui` lists `setup` as a separate project. Run it first, and again once the state has expired.
- `npm run test:debug` also pauses on the setup test before reaching yours.

## Known app bugs

These tests assert the correct behaviour and are marked with `test.fail()`, so the bugs stay tracked:

- `problem_user` has broken sorting and broken product images, on purpose.
- The checkout overview shows the item total as a raw float for 18 of the 63 possible carts, for example `Item total: $59.980000000000004`. This one affects the normal `standard_user`. It isn't known whether SauceDemo intends it.

How they behave in a run:

- These three tests show `✘` in the list output but count as passed, and the run still exits 0.
- If any of the bugs is ever fixed, the test reports `Expected to fail, but passed.` and the run goes red, which is the cue to remove `test.fail()`.

## Console errors

Every test fails at the end if the page logged a `console.error` or threw an uncaught exception, through an automatic fixture in `fixtures/pages.fixture.ts`. Uncaught exceptions matter most here: nearly all of `error_user`'s failures arrive that way, not through the console.

- **Ignored on purpose (`utils/console.ts`):** the 404 status SauceDemo's server gives a direct visit to its `.html` pages (seen on the inventory, product detail, cart and both checkout pages). If new noise appears, read it before adding it to this list.
- **Telemetry is answered locally:** SauceDemo posts telemetry to `events.backtrace.io` with placeholder credentials. An automatic fixture answers those requests with a 200, so the tests don't depend on that service. Filtering wasn't enough: the service normally answers 401, but once on CI it answered 502, and WebKit reported that as CORS errors that don't name the URL, which no narrow filter could tell apart from a real one.
- **To read errors in a test instead of failing on them:** use `test.use({ failOnConsoleErrors: false })` and assert on the `consoleErrors` fixture.
- **What it doesn't catch:** `alert`s (such as `error_user`'s "Sorting is broken!"), errors after a test's last action, and pages other than the test's own `page`. Firefox doesn't log failed resources to the console, so a missing asset is only caught on Chromium and WebKit.

## Visual regression

`tests/visual/` compares full-page screenshots of the inventory and the cart against committed baselines in `tests/visual/visual.spec.ts-snapshots/`. Rendering differs between operating systems, so each browser has a `-win32` and a `-linux` baseline. There are none for macOS. On a Mac the first run fails with "A snapshot doesn't exist" and writes your own baselines, which later runs then pass against, so open those images and check them before trusting the tests.

- **After an intended UI change on Windows:** run `npx playwright test --grep @visual --update-snapshots=all`, then open the changed PNGs before committing them.
- **Linux (what CI compares against):** run `npm run test:visual:update-linux` with Docker running. It uses the same Playwright image as CI, `mcr.microsoft.com/playwright:v<installed version>-noble`, so the baselines match CI pixel for pixel. When you upgrade `@playwright/test`, bump the image tag in `.github/workflows/playwright.yml` too, then regenerate.
- **`visual_user`:** its test compares that user's page against the real inventory baseline and is expected to fail (`test.fail`). Its prices are random on every load, so both inventory tests hide prices with `tests/visual/hide-prices.css`. They must hide them the same way: a mask applied only to the new screenshot would make the comparison fail whatever the page looked like. Logged in as `standard_user` instead, the test goes red with "Expected to fail, but passed", which shows the expected failure comes from `visual_user`'s page. It skips itself while snapshots are being written, because it would otherwise overwrite the real baseline with the broken page.

## Accessibility

`tests/a11y/` scans 8 page states with [axe](https://github.com/dequelabs/axe-core) against the WCAG 2.0, 2.1 and 2.2 rules at levels A and AA, and fails on any violation. SauceDemo passes today, so one test plants an image without alt text to prove the scan can fail.

Axe's best-practice rules are deliberately not gated. They report three things on SauceDemo, which are recorded here rather than tested:

- No page has an `h1` (`page-has-heading-one`).
- The login page's logo sits outside any landmark (`region`).
- The error message is an `h3` with a `role` it doesn't allow (`aria-allowed-role`).

Axe can't judge colour contrast over the product images, so it reports `color-contrast` as "incomplete" there, not as passed.

## Mobile

The `mobile-chrome` project runs the whole suite on Chromium emulating a Pixel 7 (412 × 839, touch). The existing tests needed no change, because the burger menu has the same markup on a phone. `tests/mobile/` checks that `mobile-chrome` is a mobile device with a narrow viewport and shows products in one column, and that desktop shows two. The tests pick their layout by project name, so if the project lost its device settings, the phone test would fail rather than skip.

## Browser notes

Two timing failures only appeared once Firefox and WebKit were enabled. Both are handled in the page objects, not with sleeps or retries:

- **Burger menu:** the app hides the menu about half a second after load (measured on Chromium), and a click just before that leaves it open but not displayed. `HeaderComponent.openMenu()` waits for the logout link to go hidden before clicking.
- **Dropped text on WebKit:** under load, `fill()` can succeed with no text arriving in the field. `CheckoutInfoPage.fillField()` reads the value back and refills once. A value that's still wrong fails the test's own assertions. The trade-off is that a real Safari problem of this exact kind wouldn't be reported. It isn't established whether the fault is in WebKit or Playwright. Each refill adds a `refill` annotation to the test in the HTML report, so you can see how often it happens.
- **Firefox stalls in big local runs:** on one 16-core Windows machine, about 1 in 3 full four-project runs at the default worker count had one Firefox test hang until the 30 s timeout. With `--workers=4` it hasn't happened yet (3 runs). CI isn't affected. If you see it, rerun with `npx playwright test --workers=4`.

## CI

GitHub Actions runs these jobs on every push and on pull requests to `main`:

- `test` runs the suite in four shards, as separate jobs, each with 2 workers and up to 2 retries. They run inside Playwright's Docker image, the same one that makes the Linux screenshot baselines, so no browsers are installed during the run. With today's test order, each shard turns out to be one project: Chromium, Firefox, WebKit, Pixel 7. This doesn't make runs meaningfully faster, because a run takes as long as its slowest shard, but a project-specific failure is visible at a glance.
- `merge-reports` combines the four shards' blob reports into one HTML report and one Allure report, even if a shard failed. Allure's history is kept in the Actions cache, so its trend charts cover recent runs (up to 20). Runs on `main` build that history; a branch run reads it but its own entries stay on the branch. History is saved even when a test or merge step failed. Two runs on `main` at the same moment can each drop the other's entry, and GitHub evicts caches unused for 7 days, which resets the trends. Because history is saved after failures too, a partial merge becomes a trend entry, and re-running only the failed merge job adds the same run a second time.
- `lint` runs the type-check, ESLint and the Prettier check, so a type or style failure is reported apart from a test failure.

A test that only passes on retry is reported as `flaky` and fails the run, because a flaky result means there's a real problem to fix.

To download the reports, open a run in the [Actions tab](https://github.com/ravk24/shop-flow/actions) and find the `playwright-report` and `allure-report` artifacts. Both are uploaded after failures too, and kept for 30 days. The Allure report is a single `index.html` that opens straight from disk.

## TypeScript

Playwright runs the `.ts` files directly, so there is no build step. `tsconfig.json` is strict and only used for checking: `npm run typecheck` reports type errors without writing any files. ESLint uses `typescript-eslint`'s type-aware rules, so a Playwright call missing its `await` fails lint. Three files stay JavaScript because Node or Allure loads them directly: `eslint.config.js`, `scripts/update-linux-snapshots.js` and `allurerc.mjs`.

## Project layout

```
pages/        Page objects: one class per page, locators and actions only
components/   Shared UI such as the header (cart badge, burger menu)
fixtures/     Extends Playwright's test so specs receive page objects ready-made
data/         Test data such as user credentials and products
utils/        Small helpers such as price parsing, the console noise filter and axe's WCAG tags
tests/        Specs grouped by feature; tests own the assertions
reporters/    The Allure reporter, fixed for merged shards and clearing old results
scripts/      Regenerates the Linux screenshot baselines in Docker
docs/         Design and implementation plans
```

## Dependencies

`package.json` overrides three packages that `allure` and `eslint` pull in, so `npm audit` reports none of their published advisories:

- `glob` 14.0.3 and `minimatch` 11.0.4 replace versions with denial-of-service and traversal advisories. These are real fixes.
- `dompurify` 3.4.17 replaces 3.4.16 in the installed tree, but Allure's report UI ships its own pre-built copy of DOMPurify 3.4.16, which the override can't reach. The risk is low, because that page only renders this project's own results.

Remove each override once `allure` or `eslint` depends on a patched version.

## License

MIT, see [LICENSE](LICENSE).
