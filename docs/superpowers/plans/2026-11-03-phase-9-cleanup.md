# ShopFlow Phase 9 — Cleanup: Implementation Plan

> Executed inline with superpowers:executing-plans, then one fresh whole-branch review. The user pre-approved this phase and told me to follow my own recommendation on every decision without asking (2026-11-03). The rulings below are those recommendations.

**Goal:** Close the deferred findings from Phases 2 to 8, so the repo is consistent, its docs match the code, and §10's definition of done is ticked with evidence.

**Spec:** `PROJECT_PLAN.md` §5, §6, §9 and §10, and the deferred-findings list kept in the local `CLAUDE.md`.

## Recon (2026-11-03)

| Question | Observed | Consequence |
|---|---|---|
| `npm audit` | 17 findings (7 critical, 10 moderate), all in dev dependencies: `dompurify` ≤3.4.16 (Allure's report UI), `glob` 13 (Allure), `minimatch` 10 (ESLint, Allure). npm's suggested fixes are downgrades to `allure@0.0.0` and `eslint@4` | Use `overrides` to `dompurify` 3.4.17, `glob` 14.0.3 and `minimatch` 11.0.4. Result: 0 vulnerabilities, lint still catches a planted `waitForTimeout`, and Allure still generates |
| `@playwright/test` | `^1.64.1`, while the CI image is `v1.64.1-noble` | Pin to `1.64.1` exactly |
| ESLint 10 engines | `^20.19.0 \|\| ^22.13.0 \|\| >=24` | The README's "Node 20 or newer" is wrong |

## Rulings

1. **Overrides, not upgrades.** No upstream release of `allure` or `eslint` fixes these advisories yet. Remove each override once its parent depends on a patched version.
2. **Clear Allure results in the reporter's `onBegin`, not `globalSetup`.** It then runs only when Allure actually writes (not with `--reporter=line`, CI shards or the Docker script). It also runs on each UI-mode rerun. One file, `reporters/allure.js`, holds both fixes, and both configs use it.
3. **Save Allure history even when the merge job fails,** with `actions/cache/restore` and `actions/cache/save` split, and the save step gated on `!cancelled()`. Overlapping `main` runs and 7-day eviction are documented, not engineered around.
4. **Leave history alone: no squash of the red commit `4c0f9fe`.** It's on the published `main`, and rewriting shared history is destructive. Its fix `8569adc` follows it.
5. **Remove `CartPage.goto()`.** It's unused code, and nothing in the spec relies on it.
6. **Data-driven titles lead with the case,** for example `rejects a wrong password @regression @negative`, with the expected error asserted in the body. `invalidLogins` moves to `data/login.data.js`.
7. **Record a WebKit refill.** `fillField` adds a `refill` annotation to the test. Page objects stay free of `expect`; the annotation only makes the behaviour visible in reports.
8. **Local Firefox stalls: document, don't reconfigure.** The evidence is 3 stalls in 10 runs at 8 workers against 3 clean runs at 4, which is too thin to change the default for everyone. The README gets a troubleshooting line pointing to `--workers=4`.
9. **Add an MIT `LICENSE`** for Rahul Gupta (2026), matching `package.json`.
10. **§10 is ticked only with evidence.** That includes a timed fresh-clone setup in a temp folder, following the README.

## Tasks

1. **Dependencies:** overrides, exact Playwright pin, `LICENSE`. Verify: `npm audit` gives 0, lint passes, and a planted violation still fails lint.
2. **Reporting and tooling:**
   - `reporters/allure.js`; remove `global-setup.js`.
   - Split the cache steps.
   - `scripts/update-linux-snapshots.js`: report a missing Docker clearly, and run with `--reporter=list` so it never touches Allure output.
   - Verify: two local runs give no duplicates; `--reporter=line` leaves `allure-results` alone; merge exits 0.
3. **Test polish:**
   - Comments on PROD-09's and CHK-14's 5 s waits, and on CART-07.
   - Split the header test.
   - Titles and `data/login.data.js`.
   - Remove the redundant direct-navigation `goto`.
   - A `toHaveURL` guard so expired saved state names its cause.
   - A shared logged-out cookie guard.
   - `parseLabelAmount` trims.
   - A `TAX_RATE` constant.
   - The refill annotation.
   - Remove `CartPage.goto()`.
   - Fix AUTH-09's comment.
   - Verify: full suite green; counts unchanged except the header split (+1 per project).
4. **Docs and §10:**
   - `PROJECT_PLAN.md`: §3 rows, §5.5 note, §6.2 missing row, §8 Phase 6 goal, §10 checklist, counts.
   - `README.md`:
     - Node 20.19, `--with-deps` note, menu timing measured on Chromium.
     - Direct-visit 404 wording, macOS baselines.
     - Allure cache limits, Firefox troubleshooting, license.
   - Fresh-clone timing.
5. **Close:** fresh review, fix pass, then merge `--no-ff`, push and confirm CI.
