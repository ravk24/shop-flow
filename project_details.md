# ShopFlow: Project Details

## Goal and thinking behind it

ShopFlow is an end-to-end test automation framework for [SauceDemo](https://www.saucedemo.com), a public practice e-commerce site, built with Playwright and TypeScript (written in JavaScript first, then migrated). The goal was a portfolio project that backs a resume claim in an interview, not a demo that just runs: a framework a team could keep extending, cross-browser, with CI, reports and honest handling of flaky tests.

Guiding principles:

- **Evidence before fixes.** Every flaky test was reproduced, measured or traced before it was changed. No sleeps, and no retries used to hide failures.
- **Tests that can fail.** Every new check comes with a test that proves it catches the problem, such as a planted bug, a mutation, or a known-bad user marked `test.fail`.
- **One phase at a time.** Each phase began with live recon of the site and a written plan. It ended with a fresh code review and a merge to `main` with a green CI.

## What we built

| Phase | Delivered |
|---|---|
| 1. Scaffold | Playwright project, config, `.env` handling, first test |
| 2. Page Object Model | One class per page plus a shared header component. Page objects never assert |
| 3. Authentication | Login, logout and locked-out tests; data-driven invalid logins |
| 4. Fixtures and auth state | Custom fixtures inject page objects. A setup project logs in once and saves `storageState` |
| 5. Products and cart | Sorting, product detail and cart tests. Known `problem_user` bugs tracked with `test.fail` |
| 6. Checkout | Checkout flow, validation errors, money maths in whole cents. Found a real display bug (`$59.980000000000004`) |
| 7. CI and quality | Chromium, Firefox and WebKit; GitHub Actions with retries and artifacts; ESLint and Prettier; status badge |
| 8. Stretch goals | Console-error gate, CI sharding with merged reports, failing CI on flaky tests, visual regression, accessibility (axe), Pixel 7 mobile project, Allure report with trend history |
| 9. Cleanup | Patched dev dependencies, MIT license, test polish, docs aligned with the code, definition of done verified |
| 10. TypeScript | Typed page objects, fixtures and data; strict `tsconfig`; type-aware lint that fails a missing `await`; `tsc` in CI |
| 11. Second app | automationexercise.com through the same framework: own config, page objects and fixture, reusing the base page, console gate and axe scanner. Non-blocking CI job; registration left out (it would create real accounts) |

**Today:** 67 tests per project across 4 projects (Chromium, Firefox, WebKit, Pixel 7), about 270 runs per full suite, plus 12 tests for the second app. CI runs SauceDemo in 4 parallel shards inside Playwright's Docker image, then merges the results into one HTML report and one Allure report.

## How we achieved it

- **Structure:**
  - Page objects hold locators and actions.
  - Fixtures inject them into tests and run automatic guards: the console-error check and the telemetry stub.
  - Test data lives in `data/` and helpers in `utils/`. Specs contain only steps and assertions.
- **Stable locators:** the site's own `data-test` attributes, or roles where those don't fit. There are no CSS or XPath selectors in specs, and no `waitForTimeout` anywhere; only web-first assertions that retry automatically.
- **Flakiness, root-caused:**
  - Burger-menu timing race: wait for the menu's real state before clicking.
  - WebKit dropping typed text: read the field back and refill once, recorded as a report annotation.
  - A third-party telemetry 502 seen as CORS errors: found from a saved WebKit trace and fixed by stubbing the service.
- **Known bugs stay visible:** each one is asserted correctly and marked `test.fail`, so the suite turns red when the bug is fixed.
- **Visual baselines:** separate per OS. The Linux ones are generated in the same Docker image CI uses, so they match CI pixel for pixel.
- **Accessibility:** zero WCAG A/AA violations allowed on 8 page states, plus a planted violation that proves the check works.
- **Reporting:** an HTML report, plus Allure with history kept in the GitHub Actions cache. The Allure reporter needed a small fix to work with sharded runs.

## Top 10 interview questions

1. **Why Playwright over Selenium or Cypress?**
   Auto-waiting, real Chromium, Firefox and WebKit, a built-in runner with fixtures, parallelism and retries, and a trace viewer, all in one tool.

2. **How is the framework structured?**
   Page Object Model plus typed fixtures that inject page objects; data, helpers and specs live apart, and only specs assert.
   A second site reuses the same base page, console gate and axe scanner through its own config and fixture.

3. **How do you handle authentication?**
   A setup project logs in once and saves `storageState`. Tests reuse it, and the login tests opt out to start logged out.

4. **How do you deal with flaky tests?**
   Root-cause first, using traces, measurements and reproduction, never sleeps. CI fails any test that passes only on retry, so flakes can't hide.

5. **Give a real flaky-test example.**
   WebKit under load sometimes dropped typed text. I measured it (12 of 224 runs), then read each value back and refilled once, which brought it to 0 of 96.

6. **How do you track known application bugs?**
   The test asserts the correct behaviour and is marked `test.fail`. It stays green while the bug exists and goes red once it's fixed.

7. **How does your CI work?**
   GitHub Actions runs 4 parallel shards in Playwright's Docker image with 2 retries, then merges the blob reports into HTML and Allure artifacts. Lint and type-check run as a separate job.

8. **How do you do visual testing reliably?**
   `toHaveScreenshot` with baselines per OS, the Linux ones made in CI's own Docker image. Dynamic content is hidden the same way on both sides of the comparison.

9. **How do you make sure a check can actually fail?**
   Every gate has a test that triggers it: a planted console error, an image without alt text, a known-bad user. A mutation check confirms each one goes red.

10. **What bug did you find?**
    The checkout item total shows a raw float (`$59.980000000000004`) for 18 of 63 possible carts, even for the normal user. A `test.fail` test tracks it.
