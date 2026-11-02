# ShopFlow Phase 7 — Reporting, Cross-Browser, CI and Code Quality: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (execution method already chosen: inline, then one fresh whole-branch review). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A push triggers the workflow, all 45 tests pass on Chromium, Firefox and WebKit, lint passes, and the HTML report is downloadable from the run, with a green badge in `README.md`.

**Architecture:** The config gains two browser projects sharing the one saved login. Two timing failures that only appeared on the new browsers are fixed in the page objects. CI gets a separate `lint` job, so a style failure and a test failure are reported apart.

**Tech Stack:** Playwright 1.64, JavaScript (CommonJS), ESLint 10, `eslint-plugin-playwright` 2, Prettier 3, GitHub Actions.

**Spec:** `PROJECT_PLAN.md` §3, §7, §8 Phase 7, §9, §10.

**Verified behaviour (recon on 2026-11-01 and 2026-11-02, Windows, using a scratch config and a throwaway copy of the repo):**

| Question | Observed | Consequence |
|---|---|---|
| Suite on Firefox and WebKit, no changes | Failed in 3 of 3 full runs, 1 or 2 tests each, never the same set. No failures on Chromium | Two separate causes, below |
| `shows an empty cart in the header`, 30 repeats each, 8 workers | 8 of 60 failed: 1 Firefox, 7 WebKit. `Received: hidden`. 15 serial repeats passed | Depends on timing, not on the browser being wrong |
| Why the link reads as hidden | `.bm-menu-wrap` is `display: none` even though the click happened. On Chromium, the wrap goes from `block` to `none` 500 to 600 ms after load, and clicking at 400 ms left the menu broken 1 time in 20 | **App race.** A click landing just before that switch is undone by it. On Firefox and WebKit the same trigger is inferred, not measured |
| Menu fix: wait for the link to go hidden, then click | 0 of 120 failed (this test and AUTH-02, Firefox and WebKit). The direct probe was also 0 of 60 | Decision 1 |
| Logout link before the menu opens | Counts as visible during those first 500 ms, positioned off screen | Today's `toBeVisible` can pass without the menu opening. The fix makes it meaningful |
| Checkout tests on WebKit, 8 workers | Lost a field in 12 of 224 runs at 8 workers, and 1 of 32 at 2 workers. Happens with video off too (7 of 64). Firefox and Chromium 0 of 64 each | Also affects CI's 2 workers |
| What the loss looks like | `fill()` succeeds, the field stays empty, and no `input` event ever fires. The element isn't removed. It's always the first field filled. Continue then correctly shows `Error: First Name is required`, and tests time out at 30 s waiting for the overview | **Not the app wiping it.** The text never arrived. Whether the fault is in WebKit or Playwright is not established |
| Fill fixes on WebKit, 96 runs each, 8 workers | Unchanged: 3 lost. Click first: 0. Focus first: 0. Read back and refill: 0, with 1 refill recorded | Decision 2 |
| Both fixes, all three browsers | 3 of 3 full runs clean; `--repeat-each=3` 405 of 405 in 3.4 min | Fixes hold together |
| Timings with both fixes | Full three-browser run about 75 s; smoke 12.7 s (16 passed); Chromium only 15 s | Inside the 60 s smoke goal and the 10-minute cookie |
| Saved login across browsers | Setup logs in on Chromium; Firefox and WebKit accept the state | One setup step, so 136 = 1 + 45 × 3 |
| ESLint recommended + Playwright recommended | 3 findings, all config: `setup` alias (2), `expectSortToWork` not recognised as an assertion (1). All cleared by the settings in Task 2, with no rule turned off | Task 2 |
| Prettier, `singleQuote`, `printWidth: 140` | Only `playwright.config.js`, `login.negative.spec.js` and the workflow change | Low churn |
| Forced failure with `CI=1` | Attempt 0: screenshot, video. Attempt 1: those plus trace. Attempt 2: no trace. Flaky test: reported `flaky` after 2 attempts, with a trace on the passing retry | `on-first-retry` behaves as documented |
| `.auth/standard.json` from another directory | The run passes; the file is written under the current directory for both reads and writes | **Corrects a Phase 4 deferred note.** The two don't disagree |
| CI today | `ubuntu-latest` is `ubuntu-24.04`. Warnings: Node 20 actions, `ubuntu-latest` moving to Ubuntu 26. Latest actions: `checkout` v7.0.1, `setup-node` v7.1.0, `upload-artifact` v7.0.2 | Decision 4 |

**Not verified:** WebKit and Firefox on Linux. CI is the first real run there, so Task 3 can surface new failures.

## Global Constraints

- JavaScript (CommonJS). Page objects never contain `expect`; `locator.waitFor` is fine.
- Locators are defined once in constructors. Specs import only from `fixtures/pages.fixture.js`.
- No `waitForTimeout` in the repo. Don't add retries, longer timeouts or sleeps to make a flake go away.
- CI settings stay as specified: `retries: 2`, `workers: 2`, `forbidOnly` on. Retries are not a fix: a `flaky` result is treated as a bug.
- No ESLint rule is disabled or downgraded to get to zero findings.
- Branch `phase-7-ci-quality`. Imperative commits ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `CLAUDE.md` stays out of commits.
- Read each test run's own exit code. Use the Edit tool for lines containing regexes. Confirm temporary mutations are reverted.

## Decisions Needing Approval

1. **`openMenu()` waits for the logout link to go hidden before clicking.** It's a condition, not a sleep, and it fixes the header test and protects AUTH-02. It also makes the header test's `toBeVisible` able to fail. The cost is that `openMenu()` would hang until timeout if the menu is already open; nothing calls it that way.
2. **`fillCustomer` reads each field back and refills once if the text didn't arrive.** I prefer this to the equally clean "focus first" because it addresses the failure actually observed, whereas I can't explain why focusing helps. It can't hide an app bug that rejects input: a value that's still wrong goes on to fail the test's own assertions. It does mean a real Safari problem of this kind wouldn't be reported. `LoginPage` stays as it is, with no failures seen there.
3. **CI runs on every branch push**, plus PRs to `main`, matching the spec's "on every push" and clearing the Phase 7 deferred note. A PR from a branch would run twice, and you don't use PRs today.
4. **Pin `ubuntu-24.04` and Node `24`.** `ubuntu-latest` is about to move to Ubuntu 26, and I can't confirm Playwright's WebKit dependencies there. A pinned OS means a deliberate upgrade rather than a surprise red build. `lts/*` also becomes the version the project is developed on.
5. **Demonstrate retries on a throwaway branch.** §8 asks for a deliberate flaky test, then its removal. Doing it on `phase-7-retry-demo`, deleted afterwards, keeps it out of `main`'s history, but a deliberately red run stays visible in the Actions tab. It doesn't affect the badge, which is scoped to `main`.
6. **Keep `if: ${{ !cancelled() }}` on the artifact upload** rather than §8's `if: always()`. It still uploads after failures, and doesn't upload after a cancelled run. §8's text is updated.

## Review Focus

1. **A fix that hides a real failure.** Refilling could mask bad input handling. Pinned by a stub check of `fillField` (Task 1 Step 8) and by the negative checkout tests still passing with blank values.
2. **The header test passing without the menu opening.** Pinned by a mutation removing the click (Task 1 Step 5).
3. **CI green only because of retries.** Pinned by reading `stats.flaky` from the CI run, which must be 0 (Task 3 Step 5).
4. **Lint made quiet rather than clean.** Pinned by proving ESLint catches a planted `waitForTimeout` (Task 2 Step 4) and by the no-rule-disabled constraint.
5. **A run outliving the 10-minute cookie on slow CI runners.** Pinned by recording CI's test-step duration (Task 3 Step 5). Over 8 minutes goes to the user rather than being worked around.

---

## File Structure (end of Phase 7)

```
playwright.config.js                # + firefox, webkit
components/HeaderComponent.js       # openMenu waits for the settled menu
pages/CheckoutInfoPage.js           # fillCustomer reads back and refills
eslint.config.js, .prettierrc, .prettierignore  # NEW
package.json, package-lock.json     # lint tools; lint, format, format:check, test:all-browsers
.github/workflows/playwright.yml    # versions, triggers, lint job
README.md, PROJECT_PLAN.md          # badge, browsers, status
```

---

### Task 1: Cross-browser projects and the two timing fixes

**Files:** Modify `playwright.config.js`, `package.json`, `components/HeaderComponent.js`, `pages/CheckoutInfoPage.js`. Add this plan.

**Interfaces:**
- Produces projects `chromium`, `firefox`, `webkit`, as §7.1.
- Produces npm script `test:all-browsers`, as §7.3.
- `HeaderComponent.openMenu()`: unchanged signature.
- `CheckoutInfoPage.fillCustomer(customer)`: unchanged signature, plus `fillField(field, value)`.

- [ ] **Step 1: Branch and baseline**

Run: `git switch -c phase-7-ci-quality`, then `npx playwright test; echo "exit=$?"`
Expected: 46 passed, `exit=0`.

- [ ] **Step 2: Add the projects and the script**

Run: `npx playwright test --list | tail -1`
Expected: `Total: 136 tests in 9 files`.

- [ ] **Step 3: RED — the menu failure reproduces**

Run: `npx playwright test tests/products/inventory.spec.js -g "empty cart in the header" --project=firefox --project=webkit --repeat-each=30; echo "exit=$?"`
Expected: `exit=1`, at least one `Received: hidden` on `logout-sidebar-link`. If it passes by chance, repeat up to twice.

- [ ] **Step 4: Fix `openMenu()`, then GREEN**

`await this.logoutLink.waitFor({ state: 'hidden' });` before the click, with a comment explaining that the app hides the menu shortly after load, and a click just before that leaves it open but not displayed.

Run the Step 3 command.
Expected: 61 passed, `exit=0`.

- [ ] **Step 5: Mutation — the menu must really open**

Temporarily remove the click from `openMenu()`. Run the test once per browser with `-g "empty cart in the header"`.
Expected: `exit=1` on all three, `Received: hidden`. Revert.

- [ ] **Step 6: RED — the fill failure reproduces**

Run: `npx playwright test tests/checkout/checkout.positive.spec.js --project=webkit --repeat-each=8; echo "exit=$?"`
Expected: `exit=1`, with a failure on step one (`Checkout: Your Information`, or a timeout on an overview label). If it passes by chance, repeat up to twice.

- [ ] **Step 7: Fix `fillCustomer`, then GREEN**

`fillCustomer` calls `fillField` for each field. `fillField` calls `field.fill(value)`, and if `field.inputValue()` differs, calls `field.fill(value)` once more. A comment records the observation: on WebKit under load, `fill()` can succeed with no text arriving.

Run the Step 6 command.
Expected: 65 passed (setup plus 64), `exit=0`.

- [ ] **Step 8: Check `fillField` with a stub**

In a scratch script, call `CheckoutInfoPage.prototype.fillField` with stub fields, not committed:

| Stub | Expected |
|---|---|
| Keeps the value on the first fill | 1 `fill` call |
| Drops the first fill, keeps the second | 2 `fill` calls |
| Never keeps it | 2 `fill` calls, no throw |
| Value `''` on an empty field | 1 `fill` call |

- [ ] **Step 9: Stability**

Run: `npx playwright test --repeat-each=3; echo "exit=$?"`
Expected: 406 passed, `exit=0`. Treat any intermittent failure as a bug.

- [ ] **Step 10: Commit**

Message: `Enable Firefox and WebKit and fix two timing failures`

---

### Task 2: ESLint and Prettier

**Files:** Create `eslint.config.js`, `.prettierrc`, `.prettierignore`. Modify `package.json`, `package-lock.json`, and files Prettier reformats.

**Interfaces:**
- Produces npm scripts `lint` (`eslint .`), `format` (`prettier --write .`) and `format:check` (`prettier --check .`).

Pinned dev dependencies: `eslint@10.14.0`, `@eslint/js@10.0.1`, `eslint-plugin-playwright@2.12.1`, `prettier@3.9.10`, `globals@17.14.0`, `eslint-config-prettier@10.1.8`.

- [ ] **Step 1: RED — install and configure without the two settings**

`eslint.config.js`, in order: ignores (`playwright-report/`, `test-results/`, `blob-report/`), `js.configs.recommended`, CommonJS with `globals.node`, the Playwright `flat/recommended` config limited to `tests/**/*.js`, then `eslint-config-prettier`.

Run: `npm run lint; echo "exit=$?"`
Expected: `exit=1`, 2 `no-standalone-expect` in `auth.setup.js` and 1 `expect-expect` warning in `inventory.spec.js`.

- [ ] **Step 2: Teach the config about the project's names**

On the Playwright block: `settings: { playwright: { globalAliases: { test: ['setup'] } } }` and `'playwright/expect-expect': ['warn', { assertFunctionNames: ['expectSortToWork'] }]`, keeping the recommended rules.

Run: `npm run lint; echo "exit=$?"`
Expected: no output, `exit=0`.

- [ ] **Step 3: Prettier**

`.prettierrc`: `{ "singleQuote": true, "printWidth": 140 }`. `.prettierignore`: `docs/`, `*.md`, `package-lock.json`, `.claude/`, `.superpowers/`.

Run: `npm run format:check; echo "exit=$?"`
Expected: `exit=1`, listing `playwright.config.js`, `tests/auth/login.negative.spec.js` and the workflow.

Run: `npm run format`, then `npm run format:check; echo "exit=$?"`
Expected: `exit=0`.

- [ ] **Step 4: Prove lint can fail**

Temporarily add `await page.waitForTimeout(1);` to a test. Run `npm run lint`.
Expected: `exit=0` with a `no-wait-for-timeout` warning, because the recommended config rates it a warning. Change the `lint` script to `eslint . --max-warnings 0` so warnings fail the job. Run again.
Expected: `exit=1`. Revert the test, and run again.
Expected: `exit=0`.

- [ ] **Step 5: Suite and commit**

Run: `npx playwright test; echo "exit=$?"`
Expected: 136 passed, `exit=0`.

Message: `Add ESLint and Prettier`

---

### Task 3: CI workflow and badge

**Files:** Modify `.github/workflows/playwright.yml`, `README.md`.

- [ ] **Step 1: Rewrite the workflow**

| Setting | Value |
|---|---|
| Triggers | `push` on all branches; `pull_request` to `main` |
| Both jobs | `runs-on: ubuntu-24.04`; `actions/checkout@v7`; `actions/setup-node@v7` with `node-version: 24`; `npm ci` |
| Job `test` | `npx playwright install --with-deps`; `npx playwright test`; `actions/upload-artifact@v7`, `if: ${{ !cancelled() }}`, name `playwright-report`, path `playwright-report/`, `retention-days: 30` |
| Job `lint` | `npm run lint`; `npm run format:check` |

Run: `npm run format:check; echo "exit=$?"`
Expected: `exit=0`.

- [ ] **Step 2: Add the badge and update the README**

Badge at the top: `[![Playwright Tests](https://github.com/ravk24/shop-flow/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/ravk24/shop-flow/actions/workflows/playwright.yml)`.

- Install: `npx playwright install` (all browsers).
- Run table: `npm test` and `test:all-browsers` run all three browsers; add `test:chromium` as the fast local loop; add `lint`, `format`.
- Opening sentence: drop "It is being built phase by phase".
- New section "CI": what each job does, where to download the report, 30-day retention.

- [ ] **Step 3: Commit and push the branch**

Message: `Update the CI workflow, add a lint job and a badge`

- [ ] **Step 4: Watch the run**

Run: `gh run watch <id> --exit-status`
Expected: both jobs succeed. This is the first run of Firefox and WebKit on Linux. A failure here goes through systematic debugging, not a retry or a skip.

- [ ] **Step 5: Read what the run proves**

- Annotations: no Node 20 or `ubuntu-latest` warnings.
- Download the `playwright-report` artifact: `index.html` is present.
- Test-step log: `136 passed`, with no `flaky` line, so retries weren't needed.
- Record the test-step duration against the 10-minute cookie. Over 8 minutes: stop and bring it to the user.

---

### Task 4: Failure artifacts and retries

**Files:** A temporary spec on a throwaway branch only.

- [ ] **Step 1: Write the temporary spec**

Branch `phase-7-retry-demo` from `phase-7-ci-quality`. `tests/retry-demo.spec.js` has two tests: one asserting a wrong title always, and one asserting a wrong title only when `testInfo.retry === 0`, each with a 1 s `expect` timeout.

- [ ] **Step 2: Run it locally the way CI does**

Run: `CI=1 npx playwright test tests/retry-demo.spec.js --project=chromium --reporter=json`, output to the scratchpad.
Expected: `exit=1`; forced failure `unexpected` with 3 attempts, trace on attempt 1 only; flaky test `flaky` with 2 attempts; screenshot and video on each failed attempt.

- [ ] **Step 3: Confirm it on CI**

Commit and push the branch. Run: `gh run watch <id> --exit-status`.
Expected: non-zero, with `test` failed. Download the artifact.
Expected: the report's `data/` folder contains `.png`, `.webm` and trace `.zip` files. Open one trace locally with `npx playwright show-trace`.

- [ ] **Step 4: Remove it**

`git switch phase-7-ci-quality`, `git push origin --delete phase-7-retry-demo`, `git branch -D phase-7-retry-demo`.
Expected: `git log phase-7-ci-quality` has no demo commit, and no `retry-demo` file exists on the branch.

---

### Task 5: Full verification and docs

**Files:** Modify `README.md`, `PROJECT_PLAN.md`, `CLAUDE.md` (local handoff file, stays untracked).

- [ ] **Step 1: Filtered runs from a clean state**

Before each, run `rm -rf .auth`.

| Command | Expected |
|---|---|
| `npm run test:smoke; echo "exit=$?"` | 16 passed, `exit=0`, under 60 s |
| `npm run test:negative; echo "exit=$?"` | 46 passed, `exit=0` |
| `npm run test:regression; echo "exit=$?"` | 136 passed, `exit=0` |
| `npm run test:chromium; echo "exit=$?"` | 46 passed, `exit=0` |
| `npm run test:all-browsers; echo "exit=$?"` | 136 passed, `exit=0` |
| `npm run lint; echo "exit=$?"` | `exit=0` |

- [ ] **Step 2: Check expected failures and framework rules**

From a JSON report: `stats.unexpected` and `stats.flaky` are 0, and PROD-09, PROD-10 and CHK-14 are the only `expectedStatus: failed` tests, on each of the three projects (9 results).
Grep the repo's `tests/`, `pages/` and `components/` for `waitForTimeout`.
Expected: no matches.

- [ ] **Step 3: Update docs**

- `README.md`: add a short "Browser notes" section on the two timing findings.
- `PROJECT_PLAN.md`: status becomes `Phases 1 to 7 complete, Phase 8 stretch goals next`. §7.3 gains `format:check` and the `--max-warnings 0` lint script. §8 Phase 7 task 3 says `!cancelled()`. §11 point 4 mentions the menu and dropped-text findings as real examples.
- `CLAUDE.md`: status, hash and counts. Add the recon table's new facts. Remove the three Phase 7 deferred notes. Replace the Phase 4 `.auth` note with the verified behaviour.

- [ ] **Step 4: Commit**

Stage `README.md` and `PROJECT_PLAN.md` only.
Message: `Document cross-browser findings and record Phase 7 completion`

---

## Finish

1. Run one fresh whole-branch review and resolve its findings.
2. Merge to `main` with `--no-ff` as `Merge phase-7-ci-quality`, push `main` and the branch, and confirm CI and the badge are green on `main`.
3. Explain the concepts in plain words: workers and parallelism, sharding, retries and flaky-test policy, `forbidOnly`, why `--with-deps`, and artifact retention.
