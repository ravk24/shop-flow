# ShopFlow Phase 8 — Console Error Detection, CI Sharding and Flaky Policy: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (execution method: inline, then one fresh whole-branch review, as in earlier phases). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Any uncaught page error or `console.error` fails the test that caused it, on all three browsers; CI runs in three shards and publishes one merged HTML report; and a flaky run turns CI red.

**Architecture:** An automatic fixture in `fixtures/pages.fixture.js` guards every test, using a small pure filter for the app's two known noise sources. CI splits `test` into a three-part matrix that uploads blob reports, and a new `merge-reports` job builds the one downloadable report. The config gains `failOnFlakyTests`.

**Tech Stack:** Playwright 1.64, JavaScript (CommonJS), GitHub Actions, `actions/download-artifact` v8.

**Spec:** `PROJECT_PLAN.md` §6, §7, §8 Phase 8 (rows "Console error detection" and "Sharding in CI"), §9. Scope chosen by the user on 2026-11-02: those two goals, plus failing CI on flaky runs. The other six stretch goals are out of scope.

**Verified behaviour (recon on 2026-11-02, Windows, throwaway copy of the repo):**

| Question | Observed | Consequence |
|---|---|---|
| What `standard_user` logs in a full walk | Chromium and WebKit: 2 `console.error`s, `Failed to load resource ... 401`, from `events.backtrace.io` telemetry with placeholder `UNIVERSE`/`TOKEN`. Firefox logs nothing for it. They can arrive at login or a later step | A plain fixture would fail most of the suite. Filter by source URL |
| Direct visits to `/inventory.html`, `/cart.html`, both checkout steps, `/inventory-item.html?id=4` | The document itself returns HTTP 404 and the app still renders. Chromium and WebKit log `status of 404`. Firefox logs nothing | Second noise source. The filter must also match a query string: `\.html$` alone missed `?id=4` |
| Where `error_user`'s failures surface | `pageerror`: `Failed to add item to the cart.`, `Failed to remove item from cart.`, reading `value` of undefined at checkout, `wa.cesetRart is not a function` at Finish. `console.error`: only the product detail render error | **The spec's `page.on('console')` alone would miss nearly all of them.** Decision 1 |
| Sorting as `error_user` | Only an `alert`: `Sorting is broken!`. No console or page error | The fixture doesn't catch it. Documented limit |
| `error_user` add-to-cart, by product | Bolt T-Shirt, Fleece Jacket and Red T-Shirt throw and don't add; the other 3 work; badge ends at 3 | Bolt and Backpack make a clean pair of tests |
| Same, repeated errors on WebKit | Fleece Jacket's repeat error was missing in 3 of 4 runs, and the badge was still 3. Chromium and Firefox reported all 3, 4 of 4 | Never count errors. Assert the first error on a fresh page |
| Message text across browsers | `Failed to add item to the cart.` is identical. The render error reads `Error` on Firefox. The others differ | Assert exact text on the add-to-cart error only |
| Does a real missing resource still get collected with the filter | Yes on Chromium and WebKit, 4 of 4 (`fetch('/definitely-missing.png')`). Firefox never logs it | CON-04 skips Firefox |
| Whole suite with the fixture on, `--repeat-each=2`, 3 browsers | 271 of 271 passed, no flaky | No test needs changing |
| Fixture throw at teardown | Plain test goes red with the message. With `test.fail()`: expected. `test.fail()` with nothing logged: red on Firefox, proving it isn't vacuous | CON-03 pins the gate |
| `--shard=N/3`, CI mode | **Each shard is exactly one browser:** 1 = Chromium (29 s), 2 = Firefox (50 s), 3 = WebKit (56 s). Each runs its own setup login | Decision 3. A merged run has 3 setup results |
| Merging three blobs | `merge-reports` builds HTML and JSON with no browsers: `expected: 138`. Blob files are named `report-1.zip` and so on | Merge job needs only `npm ci` |
| `failOnFlakyTests` with `CI=1` | Exit 1 with `1 flaky`. Merged stats still report `flaky: 1` | Works, and stays visible after merging |
| `download-artifact` | Latest v8.0.2. `upload-artifact` is v7.0.2 | Compatibility is first proven on CI |

**Not verified:** the matrix and merge job on GitHub (Task 2 is the first run), and the fixture on Linux. One raw-locator spike timed out on WebKit at `error_user` login. I suspect the dropped-text problem but did not confirm it; the same flow through `LoginPage` then passed 4 of 4.

## Global Constraints

- JavaScript (CommonJS). Page objects never contain `expect`. Specs import only from `fixtures/pages.fixture.js`.
- Locators are defined once in constructors. No `waitForTimeout` in the repo. Don't add retries, longer timeouts or sleeps to make a flake go away.
- No ESLint rule is disabled or downgraded. `npm run lint` and `npm run format:check` pass at every commit.
- CI settings stay: `retries: 2`, `workers: 2`, `forbidOnly` on.
- Branch `phase-8-console-sharding`. Imperative commits ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `CLAUDE.md` stays out of commits.
- Read each test run's own exit code. Use the Edit tool for lines containing regexes. Confirm temporary mutations are reverted.

## Decisions Needing Approval

1. **The fixture listens to `pageerror` as well as `console`.** This goes beyond the spec's wording, because nearly all of `error_user`'s real failures arrive as uncaught exceptions. §8's row is updated to match.
2. **It guards every test automatically, with a narrow filter.** Only the telemetry host and a 404 for an `.html` document are ignored, not every `Failed to load resource`, so a truly missing asset still fails on Chromium and WebKit. The cost is that any new noise from SauceDemo turns tests red until someone reads it and adds it. That is the point of the check, but it adds a way for a third-party site to break the build.
3. **Keep `--shard=N/3` even though it splits by browser.** The spec asks for it, and it demonstrates blob reports and merging. It won't make runs faster in any way that matters: the run takes as long as the slowest shard, each shard installs all three browsers, and total runner minutes go up. Because each browser becomes a separate job, a WebKit-only failure is visible at a glance. In interviews, describe it as "sharding works, and here it happens to split by browser", not as a speed gain.
4. **Blob reporter on the CI command line** (`--reporter=list,blob`), not in the config. The config in §7.1 stays simpler, and `CI=1` locally still produces the normal HTML report.
5. **Prove failure handling on a throwaway branch, `phase-8-flaky-demo`.** A temporary flaky test must turn the shard red and still produce a merged report with `flaky` in it. The branch is deleted afterwards, but a deliberately red run stays in the Actions tab, as with Phase 7's demo. The badge isn't affected.

Already decided by the user: `failOnFlakyTests: !!process.env.CI`. A brief SauceDemo outage can now turn the badge red.

## Review Focus

1. **A filter that hides real errors.** Pinned by CON-04, and by the stub table in Task 1 Step 6.
2. **A gate that can't fail.** Pinned by CON-03, which goes red with `Expected to fail, but passed.` if the teardown check is removed (Task 1 Step 5).
3. **Late errors.** An error after a test's last action can land after teardown and be missed. Accepted and documented, since waiting at the end of every test would be a sleep. Tests that expect an error use `expect.poll`.
4. **A green badge with a broken report.** `merge-reports` failing doesn't change the tests, but the workflow must still go red. Pinned by reading both job results in Task 2 Step 3 and Task 3 Step 2.
5. **Flakes that `failOnFlakyTests` newly turns red.** `LoginPage` has no refill, and WebKit's dropped text could reach it (see "Not verified"). If CI goes flaky there, debug it rather than removing the setting. Pinned by Task 2 Step 3, which reads `flaky` from the logs.

---

## File Structure (end of Phase 8)

```
utils/console.js                       # NEW: isKnownNoise(text, url)
fixtures/pages.fixture.js              # + failOnConsoleErrors option, consoleErrors auto fixture
data/users.js, .env.example            # + error user
tests/console/console-errors.spec.js   # NEW: CON-01 to CON-06
playwright.config.js                   # + failOnFlakyTests
.github/workflows/playwright.yml       # matrix, blobs, merge-reports job
README.md, PROJECT_PLAN.md             # docs and status
```

---

### Task 1: Console error fixture

**Files:** Create `utils/console.js`, `tests/console/console-errors.spec.js`. Modify `fixtures/pages.fixture.js`, `data/users.js`, `.env.example`. Add this plan.

**Interfaces:**
- Produces `isKnownNoise(text, url)` returning a boolean: true when `url` contains `events.backtrace.io`, or when `text` contains `status of 404` and `url` matches `\.html(\?|$)`.
- Produces option fixture `failOnConsoleErrors` (default `true`) and auto fixture `consoleErrors`, a string array of collected messages. Teardown throws `Unexpected console errors: <messages joined with " | ">` when the option is on and the array isn't empty. It uses a plain `throw`, not `expect`.
- Produces `users.error`, from `ERROR_USER`, default `error_user`.

- [ ] **Step 1: Branch and baseline**

Run: `git switch -c phase-8-console-sharding`, then `npx playwright test; echo "exit=$?"`
Expected: 136 passed, `exit=0`.

- [ ] **Step 2: Write the spec (RED)**

`tests/console/console-errors.spec.js`, all tagged `@regression`, and `@negative` except CON-06. CON-01, 02, 04 and 05 use `test.use({ failOnConsoleErrors: false })`. CON-05 and CON-06 log in as `users.error` in `beforeEach` with empty storage state, then assert the page title and 6 items, as the `problem_user` block does.

| ID | Title | Body and assertion |
|---|---|---|
| CON-01 | collects a console.error | On inventory, `page.evaluate` logs `planted console`. `expect.poll(() => consoleErrors).toContain('planted console')` |
| CON-02 | collects an uncaught exception | On inventory, `page.evaluate` throws `planted throw` inside `setTimeout`. `expect.poll(() => consoleErrors.join())` contains `planted throw` |
| CON-03 | fails a test that logs an error | `test.fail()`, then on inventory `page.evaluate` logs `planted failure`. No other assertion |
| CON-04 | still collects a missing resource | `test.skip` on Firefox, with the reason. Fetch `/definitely-missing.png`. `expect.poll(() => consoleErrors.join())` contains `status of 404` |
| CON-05 | error_user: adding the Bolt T-Shirt throws | Add `products` Bolt T-Shirt. `expect.poll(() => consoleErrors).toContain('Failed to add item to the cart.')`. Badge hidden. Comment: known bug; this goes red if it's fixed |
| CON-06 | error_user: adding the Backpack works | Add Backpack with the default gate on. Badge shows `1` |

Run: `npx playwright test tests/console --project=chromium; echo "exit=$?"`
Expected: `exit=1`, failing on the missing `consoleErrors` fixture.

- [ ] **Step 3: Implement `isKnownNoise`, the fixtures and `users.error`**

Comment the two noise sources in `utils/console.js`, with what they are. Comment on the fixture that it covers `page` only and can miss an error after a test's last action, and that `alert`s aren't covered.

- [ ] **Step 4: GREEN**

Run: `npx playwright test tests/console; echo "exit=$?"`
Expected: 18 tests on 3 browsers plus setup: 18 passed, 1 skipped (CON-04, Firefox), `exit=0`.

- [ ] **Step 5: Mutations**

Apply each alone, run the stated command, confirm the result, then revert.

| Mutation | Command | Expected |
|---|---|---|
| Remove the teardown `throw` | `tests/console --project=chromium -g "fails a test"` | Red: `Expected to fail, but passed.` |
| Remove the `pageerror` listener | `tests/console --project=chromium -g "uncaught\|Bolt"` | Red, 2 failed |
| Remove the `console` listener | `tests/console --project=chromium -g "collects a console"` | Red |
| `isKnownNoise` returns false always | `tests/products/inventory.spec.js --project=chromium` | Red: `Unexpected console errors` |
| `isKnownNoise` returns true for any `Failed to load resource` | `tests/console --project=chromium -g "missing resource"` | Red |

- [ ] **Step 6: Check `isKnownNoise` with a stub table**

In a scratch script, not committed:

| text | url | Expected |
|---|---|---|
| `... status of 401 ...` | `https://events.backtrace.io/api/x` | true |
| `... status of 404 ...` | `https://www.saucedemo.com/inventory.html` | true |
| `... status of 404 ...` | `https://www.saucedemo.com/inventory-item.html?id=4` | true |
| `... status of 404 ...` | `https://www.saucedemo.com/definitely-missing.png` | false |
| `... status of 500 ...` | `https://www.saucedemo.com/inventory.html` | false |
| `boom` | `https://www.saucedemo.com/inventory.html` | false |

- [ ] **Step 7: Watch `error_user` fail, per §8**

Temporarily set `failOnConsoleErrors: true` for CON-05's block. Run CON-05 with `--project=chromium`.
Expected: `exit=1`, `Unexpected console errors: Failed to add item to the cart.` Revert.

- [ ] **Step 8: Stability and commit**

Run: `npx playwright test --repeat-each=3; echo "exit=$?"`
Expected: 457 passed, 3 skipped (3 × 153 tests, less the 3 CON-04 skips on Firefox, plus 1 setup, which isn't repeated), `exit=0`.
Run: `npm run lint; npm run format:check`.
Expected: both exit 0.

Message: `Fail tests on console and page errors`

---

### Task 2: Flaky policy, sharding and merged report

**Files:** Modify `playwright.config.js`, `.github/workflows/playwright.yml`, `README.md`.

**Interfaces:**
- The artifact name `playwright-report` is unchanged, now uploaded by `merge-reports`.

- [ ] **Step 1: Add the setting and rewrite the workflow**

Config: `failOnFlakyTests: !!process.env.CI`.

| Setting | Value |
|---|---|
| Job `test` | `strategy: { fail-fast: false, matrix: { shard: [1, 2, 3] } }`; checkout, setup-node, `npm ci`, `npx playwright install --with-deps`; `npx playwright test --shard=${{ matrix.shard }}/3 --reporter=list,blob`; `actions/upload-artifact@v7`, `if: ${{ !cancelled() }}`, name `blob-report-${{ matrix.shard }}`, path `blob-report/`, `retention-days: 1` |
| Job `merge-reports` | `needs: [test]`, `if: ${{ !cancelled() }}`; checkout, setup-node, `npm ci`; `actions/download-artifact@v8` with `pattern: blob-report-*`, `merge-multiple: true`, `path: all-blob-reports`; `npx playwright merge-reports --reporter=html ./all-blob-reports`; `actions/upload-artifact@v7`, `if: ${{ !cancelled() }}`, name `playwright-report`, path `playwright-report/`, `retention-days: 30` |
| Job `lint` | Unchanged |

Run: `npm run format:check; echo "exit=$?"`
Expected: `exit=0`.

- [ ] **Step 2: Check the same steps locally**

Run shards 1 to 3 with `CI=1 ... --reporter=list,blob`, copying each `blob-report/*.zip` into a scratch folder, then `merge-reports --reporter=json` on it.
Expected: each exits 0. Merged stats: `unexpected: 0`, `flaky: 0`, `skipped: 1`, `expected: 155` (153 tests less 1 skipped, plus 3 setup steps; `test.fail` results count as expected).

- [ ] **Step 3: Update the README, commit, push the branch and watch**

README CI section: three shards, one browser each; the merged report; a flaky run fails CI. Run table and Project layout: add `tests/console`. Add a "Console errors" section: what it catches, the two ignored sources, and the limits (alerts, errors after the last action, and Firefox not logging failed resources).

Message: `Shard CI, merge reports and fail on flaky runs`

Run: `gh run watch <id> --exit-status`
Expected: all five jobs succeed.
Then read: no `flaky` line in any shard's log; no annotations; the `playwright-report` artifact contains `index.html`, and blob artifacts are listed separately. Record each shard's test-step time and the run's wall-clock time, against Phase 7's 2m26s.

---

### Task 3: Prove failure handling

**Files:** A temporary spec on a throwaway branch only.

- [ ] **Step 1: Write the temporary spec**

Branch `phase-8-flaky-demo` from `phase-8-console-sharding`. `tests/flaky-demo.spec.js`: one test asserting a wrong title only when `testInfo.retry === 0`, with a 1 s `expect` timeout. It runs once per browser, so all three shards are affected.

- [ ] **Step 2: Push and watch**

Run: `gh run watch <id> --exit-status`
Expected: non-zero. Every `test` shard fails with `1 flaky`, and `merge-reports` still succeeds. Download `playwright-report` and confirm `index.html` plus a trace `.zip` in `data/`.

- [ ] **Step 3: Remove it**

`git switch phase-8-console-sharding`, `git push origin --delete phase-8-flaky-demo`, `git branch -D phase-8-flaky-demo`.
Expected: no demo commit on the branch, and no `flaky-demo` file.

---

### Task 4: Full verification and docs

**Files:** Modify `README.md`, `PROJECT_PLAN.md`, `CLAUDE.md` (stays untracked).

- [ ] **Step 1: Filtered runs from a clean state**

Before each, run `rm -rf .auth`.

| Command | Expected |
|---|---|
| `npm run test:smoke; echo "exit=$?"` | 16 passed, `exit=0`, under 60 s |
| `npm run test:negative; echo "exit=$?"` | 60 passed, 1 skipped, `exit=0` |
| `npm run test:regression; echo "exit=$?"` | 153 passed, 1 skipped, `exit=0` |
| `npm run test:chromium; echo "exit=$?"` | 52 passed, `exit=0` |
| `npm run lint; echo "exit=$?"` | `exit=0` |

- [ ] **Step 2: Check expected failures from a JSON report**

`unexpected` and `flaky` are 0. `expectedStatus: failed` covers exactly PROD-09, PROD-10, CHK-14 and CON-03, on each project (12 results), and each failure message is the expected reason. Grep `tests/`, `pages/`, `components/`, `fixtures/` for `waitForTimeout`: no matches.

- [ ] **Step 3: Update docs**

- `PROJECT_PLAN.md`: status becomes `Phases 1 to 7 complete; Phase 8: console errors and CI sharding done`. §5 and §4 structure gain `utils/console.js` and `tests/console/`. §6 gains a console table with CON-01 to CON-06. The coverage summary is rebuilt from `--list`, which also resolves its stale 44. §7.1 gains `failOnFlakyTests`, §7.2 gains `ERROR_USER`. §8's console row mentions `pageerror`, and its sharding row notes the split by browser. §11 point 4 mentions enforcing the flaky policy.
- `CLAUDE.md`: status, hash and counts. Close the flaky decision and add this plan's recon facts.

- [ ] **Step 4: Commit**

Stage `README.md` and `PROJECT_PLAN.md` only.
Message: `Document console checks and sharding, and record Phase 8 progress`

---

## Finish

1. Run one fresh whole-branch review and resolve its findings.
2. Merge to `main` with `--no-ff` as `Merge phase-8-console-sharding`, push `main` and the branch, and confirm CI and the badge are green on `main`.
3. Explain the concepts in plain words: event listeners, custom and automatic fixtures, option fixtures, why a teardown check can fail a test, the blob reporter, how `--shard` splits tests and why it split by browser here, merging reports, and what `failOnFlakyTests` changes.
