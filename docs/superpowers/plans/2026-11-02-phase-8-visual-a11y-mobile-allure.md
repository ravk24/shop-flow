# ShopFlow Phase 8 (round 2) — Visual Regression, Accessibility, Mobile Viewport and Allure: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (execution method: inline, then one fresh whole-branch review, as in earlier phases). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Screenshots of the inventory and cart are compared on every run, every main page state is scanned for WCAG A/AA violations, the whole suite also runs on a Pixel 7, and CI publishes an Allure report with history next to the HTML report.

**Architecture:** A fourth project, `mobile-chrome`, runs the existing suite unchanged. Three new spec folders hold the new tests: `tests/visual/`, `tests/a11y/` and `tests/mobile/`. Axe gets a fixture and a small formatting helper. CI's test job moves into the official Playwright image, so Linux screenshots match those made locally in Docker. The job splits into 4 shards. The merge job gains an Allure reporter and a cached history file.

**Tech Stack:** Playwright 1.64, JavaScript (CommonJS), `@axe-core/playwright` 4.14.0, `allure-playwright` 3.14.0, `allure` 3.22.1 (the Node CLI, no Java), Docker image `mcr.microsoft.com/playwright:v1.64.1-noble`, `actions/cache` v6.

**Spec:** `PROJECT_PLAN.md` §6, §7, §8 Phase 8 (rows "Visual regression", "Accessibility checks", "Mobile viewport", "Allure or Monocart reporter"), §9. Scope chosen by the user on 2026-11-02. TypeScript migration and the second target app are out of scope.

**Verified behaviour (recon on 2026-11-02, Windows, scratch specs run through the repo's config and fixtures):**

| Question | Observed | Consequence |
|---|---|---|
| Whole suite on `devices['Pixel 7']` (Chromium, 412×839, touch) | 52 of 52 passed, including the 4 `test.fail`s and the logout test through `HeaderComponent.openMenu()` | **§8's "adjust `HeaderComponent` for mobile" isn't needed.** The menu markup and test ids are identical on mobile. Decision 1 |
| Mobile layout | One column of cards, and the sort control collapses to an icon (the `select` still works). Desktop, at 1280 px: two columns | MOB-01 and MOB-02 assert column counts |
| `toHaveScreenshot` stability, `standard_user`, inventory and cart full page | 30 of 30 matched after the baseline (`--repeat-each=5`, 3 browsers). Raw `page.screenshot` right after load differed between two loads | Use `toHaveScreenshot`, which waits for two identical frames. No masks needed for `standard_user` |
| `visual_user` | **Prices are random on every load.** The backpack image is `sl-404`. The menu and cart icons, two product names and the last button are shifted. With prices masked, it still differs by about 4% of pixels (47–49k) on all 3 browsers | VIS-03 masks prices and is `test.fail` |
| `--update-snapshots=all` with VIS-03 under `test.fail` | **It overwrote the shared `inventory` baseline with `visual_user`'s page** (md5 changed), and the test reported `Expected to fail, but passed.` | VIS-03 must skip itself while snapshots are being written. Review Focus 1 |
| axe, all rules, 8 page states | Only best-practice rules fire: `page-has-heading-one` (every page), `region` (login), `aria-allowed-role` (the error `h3`). Nothing critical or serious | Decision 4 |
| axe, tags `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`, 8 states × 3 browsers | 0 violations everywhere. `color-contrast` is "incomplete" on inventory and menu (axe can't decide over images) | A zero-violation gate passes today, so it needs a planted violation to prove it can fail (A11Y-09) |
| Monocart 2.15.1 and Allure (`allure-playwright` 3.14.0) through `merge-reports --config` | Both produced reports from a blob. A reporter in that config resolves from the config's folder | The merge config lives in the repo root |
| Allure 3 history | With `historyPath` in `allurerc.mjs`, the JSONL file grew by one line per `generate`. `singleFile: true` gives one 2.9 MB `index.html` | History persists through `actions/cache` |
| Repo | Public, GitHub Pages not enabled. Docker 29.8 CLI installed, Desktop not running. No Java | Decisions 2 and 5 |

**Not verified:** Linux screenshots, the container job on GitHub, `--shard=N/4` giving one project per shard, and Allure history across two CI runs. Tasks 2, 4 and 5 verify each of them on CI.

## Global Constraints

- JavaScript (CommonJS). Page objects never contain `expect`. Specs import only from `fixtures/pages.fixture.js`. No locator strings in specs, except DOM injected by a test itself.
- No `waitForTimeout`. Don't add retries, longer timeouts or sleeps to make a flake go away. CI keeps `retries: 2`, `workers: 2`, `forbidOnly` and `failOnFlakyTests`.
- No ESLint rule is disabled or downgraded. `npm run lint` and `npm run format:check` pass at every commit.
- Dev dependencies are pinned exactly: `@axe-core/playwright@4.14.0`, `allure-playwright@3.14.0`, `allure@3.22.1`.
- Tags: every new test has `@regression`. Visual tests also get `@visual`, accessibility tests `@a11y`, and planted or known-bug tests `@negative`.
- Branch `phase-8-visual-a11y-mobile-allure`. Imperative commits ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. `CLAUDE.md` stays out of commits.
- Read each test run's own exit code. Use the Edit tool for lines containing regexes. Confirm temporary mutations are reverted.

## Decisions Needing Approval

1. **Mobile = a fourth project running the whole suite, with no `HeaderComponent` change.** Recon shows the menu works unchanged, so §8's wording gets corrected rather than code added for nothing. Two layout tests prove the project really is a phone. Cost: CI goes to **4 shards** (one per project), and a local full run gets about a third longer.
2. **Screenshot baselines for two platforms, made in matching environments.** `win32` baselines are generated locally. `linux` baselines are generated in Docker with `mcr.microsoft.com/playwright:v1.64.1-noble`, and **CI's test job runs in that same image** (Playwright's recommended setup). That replaces `playwright install --with-deps`. I'll start Docker Desktop on your machine to do this. Costs:
   - Updating Linux baselines needs Docker.
   - The image tag must be bumped together with `@playwright/test`. A script derives it from the installed version, and the workflow pins it, so a mismatch fails loudly.
   - Moving CI into a container could surface new timing flakes, which `failOnFlakyTests` would show.
   - macOS contributors have no baselines.
3. **Visual scope:** full-page inventory and cart (one Backpack) as `standard_user`, on all 4 projects, with Playwright's default strict comparison. VIS-03 compares `visual_user`'s inventory to the same baseline with prices masked, as `test.fail`. It skips itself when snapshots are being written or its baseline is missing. As with PROD-09, a `test.fail` body passes for any failure, so its preconditions sit in `beforeEach`.
4. **Accessibility gate = WCAG 2.0/2.1/2.2 A and AA rules, zero violations,** on 8 states: login with an error, inventory, inventory with the menu open, product detail, cart, checkout step one with an error, overview, and complete. The best-practice findings (no `h1` on any page, the login logo outside a landmark, `role` on the error `h3`) are documented in the README, not gated. Gating them would mean 8 tests that only ever fail. A11Y-09 injects an image without `alt` text to prove the gate can fail.
5. **Allure 3 rather than Monocart,** because Allure is the widely recognised name and version 3 needs no Java. Allure runs as a second reporter: the HTML report stays the default. On CI the merge job writes `allure-results`, restores `allure-history` from `actions/cache` (keyed by run, restored by prefix, history limit 20), generates a single-file report and uploads it as the `allure-report` artifact, kept for 30 days. Not GitHub Pages: enabling Pages is a repo setting you'd have to turn on, and it can come later. Cache scope means trends follow `main`: branch runs read `main`'s history, and their own runs add to a branch-only copy.

## Review Focus

1. **`--update-snapshots` overwriting the real baseline with `visual_user`'s page.** Pinned by Task 2 Step 6: `--update-snapshots=all` must leave every md5 unchanged and report VIS-03 as skipped.
2. **An accessibility gate that can't fail.** Pinned by A11Y-09, watched failing first in Task 3 Step 2.
3. **Screenshots that differ between CI runs** (fonts loading, image decode, the menu's 500 ms hide). Pinned by Task 2 Step 9: two CI runs green with no flaky results.
4. **A mobile project that silently isn't mobile** (a desktop viewport would pass the whole suite). Pinned by MOB-01, plus MOB-02 showing that the column count tells the two layouts apart.
5. **Allure history that never accumulates.** Pinned by Task 4 Step 6, which reads the history line count from the second CI run's log (at least 2).

---

### Task 1: Mobile project and layout tests

**Files:**
- Modify: `playwright.config.js` (projects), `pages/InventoryPage.js`, `package.json` (scripts)
- Create: `tests/mobile/layout.spec.js`

**Interfaces:**
- Produces: project name `mobile-chrome`. `InventoryPage.columnCount(): Promise<number>` returns the number of distinct rounded left edges of `this.items`.

- [ ] **Step 1: Write the failing tests** in `tests/mobile/layout.spec.js`, under `test.describe('layout')`, with a `beforeEach` that runs `inventoryPage.goto()` and then `expect(inventoryPage.items).toHaveCount(allProducts.length)`:
  - MOB-01 `lists products in one column on a phone @regression`: `test.skip(!isMobile, 'phone layout only')`, then `await expect.poll(() => inventoryPage.columnCount()).toBe(1)`.
  - MOB-02 `lists products in two columns on desktop @regression`: `test.skip(isMobile, 'desktop layout only')`, then `.toBe(2)`.
- [ ] **Step 2: Run** `npx playwright test tests/mobile --project=chromium`. Expected: MOB-02 fails with `inventoryPage.columnCount is not a function`, and MOB-01 is skipped.
- [ ] **Step 3: Implement `columnCount()`** with `this.items.evaluateAll(...)` over `getBoundingClientRect().left`, returning the size of a `Set`. Add the `mobile-chrome` project: `{ ...devices['Pixel 7'], storageState: '.auth/standard.json' }`, depending on `setup`, after `webkit`. Add the script `"test:mobile": "playwright test --project=mobile-chrome"`.
- [ ] **Step 4: Run** `npx playwright test tests/mobile`. Expected: 4 passed (MOB-02 on 3 desktops, MOB-01 on mobile), 4 skipped, plus setup. Then `npm run test:mobile`. Expected: 52 passed and 1 skipped, exit 0.
- [ ] **Step 5: Lint, format, commit.** Message: `Add a Pixel 7 project and mobile layout tests`.

### Task 2: Visual regression with two-platform baselines

**Files:**
- Create: `tests/visual/visual.spec.js`, `tests/visual/visual.spec.js-snapshots/*.png` (16 files: inventory and cart × 4 projects × `win32`/`linux`), `scripts/update-linux-snapshots.js`
- Modify: `package.json` (scripts), `.github/workflows/playwright.yml` (test job)

**Interfaces:**
- Consumes: `mobile-chrome` (Task 1), `users.visual` (added here to `data/users.js` as `process.env.VISUAL_USER || 'visual_user'`, plus `VISUAL_USER=visual_user` in `.env.example`).
- Produces: snapshot names `inventory.png` and `cart.png`, with the default path template.

- [ ] **Step 1: Write the tests.**
  - `test.describe('visual')`:
    - VIS-01 `matches the inventory page @visual @regression`: goto, 6 items, then `await expect(page).toHaveScreenshot('inventory.png', { fullPage: true })`.
    - VIS-02 `matches the cart page with one item @visual @regression`: add `products.backpack`, open the cart, 1 row, `'cart.png'` full page.
  - `test.describe('visual - visual_user')`:
    - Empty storage state, with a `beforeEach` that logs in as `users.visual` and asserts the title and 6 items.
    - VIS-03 `matches the inventory page for visual_user @visual @regression @negative`:
      - First line: `test.skip(updateSnapshots === 'all' || updateSnapshots === 'changed' || !fs.existsSync(test.info().snapshotPath('inventory.png', { kind: 'screenshot' })), 'compares against the standard_user baseline, never writes it')`.
      - Then `test.fail()`, then the inventory screenshot with `mask: [inventoryPage.itemPrices]`.
      - Comment: prices are random per load.
- [ ] **Step 2: Run** `npx playwright test tests/visual --project=chromium`. Expected: VIS-01 and VIS-02 fail with `A snapshot doesn't exist ... writing actual`, and VIS-03 is skipped (no baseline yet).
- [ ] **Step 3: Generate the `win32` baselines** with `npx playwright test tests/visual --update-snapshots=all`. Open the 8 PNGs and check they show `standard_user`'s real pages (correct backpack image). Rerun without the flag: 8 passed and 4 VIS-03 expected failures, exit 0.
- [ ] **Step 4: Add `scripts/update-linux-snapshots.js`.**
  - It reads the version from `@playwright/test/package.json` and builds the image `mcr.microsoft.com/playwright:v<version>-noble`.
  - It runs `docker run --rm --ipc=host -v <cwd>:/work -v /work/node_modules -w /work <image> /bin/bash -c "npm ci && npx playwright test --grep @visual --update-snapshots=all"` through `spawnSync` with `stdio: 'inherit'`, and exits with Docker's status.
  - Add the script `"test:visual:update-linux": "node scripts/update-linux-snapshots.js"`.
- [ ] **Step 5: Start Docker Desktop and run** `npm run test:visual:update-linux`. Expected: 8 `-linux.png` files written, exit 0. Open two of them to check the content.
- [ ] **Step 6: Guard check.** Record md5s of all 16 PNGs, then run `npx playwright test tests/visual --update-snapshots=all`. Expected: VIS-03 skipped on 4 projects, every md5 unchanged. Revert anything that did change before going on.
- [ ] **Step 7: Move the CI test job into the container.**
  - Add `container: { image: mcr.microsoft.com/playwright:v1.64.1-noble, options: --user 1001 }`.
  - Remove the "Install Playwright Browsers" step.
  - Matrix `shard: [1, 2, 3, 4]` and `--shard=${{ matrix.shard }}/4`.
- [ ] **Step 8: Run locally:** `npm run lint`, `npm run format:check`, `npx playwright test`. Expected: exit 0. Commit with the message `Add visual regression tests with Windows and Linux baselines`, then push.
- [ ] **Step 9: CI check.**
  - Expected: all 4 shards green, each shard one project (read the project names in each log), and no `flaky`.
  - Re-run all jobs once. Expected: green again, which covers Review Focus 3.
  - If a Linux screenshot differs, read the diff in the report before changing anything.

### Task 3: Accessibility scans

**Files:**
- Create: `utils/a11y.js`, `tests/a11y/a11y.spec.js`
- Modify: `fixtures/pages.fixture.js`, `package.json` (dev dependency)

**Interfaces:**
- Produces:
  - `WCAG_TAGS`, the array of the 5 tags listed in the verified-behaviour table.
  - `describeViolations(violations): string[]`, one `"<id>: <first node target>"` per violation, for readable failures.
  - The fixture `makeAxeBuilder: () => AxeBuilder`, preset with `withTags(WCAG_TAGS)`.

- [ ] **Step 1: Write the planted test first.** A11Y-09 `reports an image without alt text @a11y @regression @negative`:
  - Inventory page with 6 items.
  - `page.evaluate` appends `<img src="/planted.png">` to `document.body`.
  - `const { violations } = await makeAxeBuilder().analyze()`.
  - `expect(describeViolations(violations)).toContainEqual(expect.stringMatching(/^image-alt: /))`.
- [ ] **Step 2: Run** with `npm install -D -E @axe-core/playwright@4.14.0` already done but no fixture yet. Expected: fails with `makeAxeBuilder` undefined (fixture not found).
- [ ] **Step 3: Implement** `utils/a11y.js` and the `makeAxeBuilder` fixture. Rerun A11Y-09 on chromium. Expected: pass.
- [ ] **Step 4: Write A11Y-01 to A11Y-08**, one per state from Decision 4, each ending with `expect(describeViolations((await makeAxeBuilder().analyze()).violations)).toEqual([])`.
  - Reach each state through the page objects, using `startCheckout`/`reachOverview` from `tests/checkout/checkout.helpers.js` where they fit.
  - Assert the state before scanning. For the open menu, use `await expect(header.logoutLink).toBeInViewport()`, because `toBeVisible` passes off screen.
  - A11Y-01 uses empty storage state and an empty-form submit.
- [ ] **Step 5: Run** `npx playwright test tests/a11y`. Expected: 36 passed (9 × 4), exit 0. Then lint, format, and commit with the message `Add WCAG accessibility scans with axe`.

### Task 4: Allure report with history

**Files:**
- Create: `allurerc.mjs`, `playwright.merge.config.js`
- Modify: `playwright.config.js` (reporter), `package.json` (dev dependencies, scripts), `.gitignore`, `.prettierignore`, `eslint.config.js` (ignores), `.github/workflows/playwright.yml` (merge job)

**Interfaces:**
- Produces:
  - `allure-results/` (raw results), `allure-report/index.html` (single file) and `allure-history/history.jsonl`.
  - The script `report:allure`.

- [ ] **Step 1: Install** with `npm install -D -E allure-playwright@3.14.0 allure@3.22.1`.
  - Add `['allure-playwright', { resultsDir: 'allure-results' }]` to the config's reporters.
  - Add `allurerc.mjs` with `{ name: 'ShopFlow', output: './allure-report', historyPath: './allure-history/history.jsonl', plugins: { awesome: { options: { singleFile: true } } } }`.
  - Add the script `"report:allure": "allure generate allure-results"`.
  - Ignore `allure-results/`, `allure-report/` and `allure-history/` in `.gitignore`, ESLint and Prettier.
- [ ] **Step 2: Run** `npx playwright test tests/e2e --project=chromium` twice, then `npm run report:allure` twice.
  - Expected: `allure-report/index.html` exists, and the history has 2 lines.
  - Check whether `allure-results` keeps the first run's files. If it does, add `--clean`-style handling, chosen from what `allure-playwright` offers. Ledger the ruling.
- [ ] **Step 3: Write `playwright.merge.config.js`** with `testDir: './tests'` and the reporters `html` (`open: 'never'`, `outputFolder: 'playwright-report'`) and `allure-playwright`.
  - Check it locally: blob-report the e2e test, then run `npx playwright merge-reports --config playwright.merge.config.js <dir>`.
  - Expected: both `playwright-report/` and `allure-results/` are written.
- [ ] **Step 4: Update the merge job.**
  - Merge with `--config playwright.merge.config.js`.
  - `actions/cache@v6`, with `path: allure-history`, `key: allure-history-${{ github.run_id }}` and `restore-keys: allure-history-`.
  - `npx allure generate allure-results --history-limit 20`.
  - Upload `allure-report/` as `allure-report`, with `if: ${{ !cancelled() }}` and a retention of 30 days.
  - Then lint, format, run the suite (exit 0), commit with the message `Publish an Allure report with history from CI`, and push.
- [ ] **Step 5: Verify on CI.** Download `allure-report` with `gh run download` and open it. Expected: tests from all 4 projects are present.
- [ ] **Step 6: History check.** Re-run the workflow, then grep the second run's merge log for the cache restore and the history line count. Expected: at least 2 entries.

### Task 5: Documentation and close

**Files:**
- Modify: `README.md`, `PROJECT_PLAN.md`

- [ ] **Step 1: Update `README.md`.**
  - Run table: `test:mobile`, `test:visual:update-linux` and `report:allure`.
  - New sections:
    - Visual regression: baselines per platform, how to update them, why VIS-03 skips while updating, and macOS having no baselines.
    - Accessibility: the WCAG gate and the documented best-practice findings.
    - Mobile.
  - CI section: 4 shards, the container, and the Allure artifact and its history.
  - Layout: `scripts/`.
- [ ] **Step 2: Update `PROJECT_PLAN.md`.**
  - Status line.
  - §6.7 Visual (VIS-01 to VIS-03), §6.8 Accessibility (A11Y-01 to A11Y-09) and §6.9 Mobile (MOB-01, MOB-02).
  - Coverage summary: 65 per project, 43 positive and 22 negative, from `npx playwright test --list --project=chromium`.
  - §7.1 projects and reporters, §7.2 `VISUAL_USER`, §7.3 scripts and §7.4 ignores.
  - Mark the four §8 rows done, and correct the mobile row's `HeaderComponent` wording.
  - §11 talking points: visual baselines per OS, the accessibility gate with its planted test, and Allure history.
- [ ] **Step 3: Full verification.** Run `npx playwright test`. Expected: exit 0, with 260 tests plus 1 setup, 5 skipped (CON-04 on Firefox, MOB-01 on 3 desktops, MOB-02 on mobile) and 20 expected failures. Then lint and format.
- [ ] **Step 4: Commit and push.** Message: `Document visual, accessibility, mobile and Allure coverage`. Wait for CI to go green.
- [ ] **Step 5: Final whole-branch review** by a fresh reviewer, then the fix pass. Merge to `main` with `--no-ff`, push, and confirm `main`'s CI and badge.
