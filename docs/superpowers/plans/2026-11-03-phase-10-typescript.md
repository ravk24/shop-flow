# ShopFlow Phase 10 — TypeScript Migration: Implementation Plan

> Executed inline with superpowers:executing-plans, then one fresh whole-branch review. The user pre-approved the remaining phases and told me to follow my own recommendation on every decision without asking (2026-11-03). The rulings below are those recommendations.

**Goal:** Convert the suite from JavaScript to TypeScript, with every test still passing, and make the type system catch real mistakes: wrong page-object calls, wrong fixture names, and Playwright calls missing their `await`.

**Spec:** `PROJECT_PLAN.md` §8, the stretch row "TypeScript migration: rename to `.ts`, add types to page objects".

## Recon (2026-11-03)

| Question | Observed | Consequence |
|---|---|---|
| Latest TypeScript | 7.0.2 | `typescript-eslint` 8.72.1 supports TypeScript below 6.1, so pin `typescript` 6.0.3 |
| Does Playwright need a build step? | No. Playwright 1.64 transpiles `.ts` specs, configs and reporters itself | `tsconfig.json` is for checking only: `noEmit` |
| Snapshot folder name | Derived from the spec file name, so `visual.spec.ts-snapshots` | Move the 16 committed baselines as pure renames; never let a run write new ones |
| `package.json` `type` | `commonjs` | Keep it. `module: nodenext` then type-checks the `.ts` files as CommonJS, which is what Playwright loads |

## Rulings

1. **TypeScript 6.0.3, not 7.** Type-aware lint is worth more than the newest compiler. Upgrade when `typescript-eslint` supports 7.
2. **Type-check only.** No compiled output to keep in sync; `npm run typecheck` (`tsc -p .`) runs in CI's `lint` job, before ESLint.
3. **Strict mode plus `noUnusedLocals` and `noUnusedParameters`.** `lib` includes `DOM` because `page.evaluate` callbacks run in the browser.
4. **Type-aware ESLint (`recommendedTypeChecked`)** on `.ts` files with `projectService`. Its `no-floating-promises` turns a missing `await` into a lint error, which is the most common Playwright bug.
5. **Two files stay JavaScript:** `eslint.config.js` and `scripts/update-linux-snapshots.js`, because Node runs them directly.
6. **`git mv` every renamed file,** so history follows each file.
7. **Page objects get `readonly` locator fields and `override async goto()`.** `BasePage` takes `(readonly page: Page)`.
8. **Fixtures typed as `base.extend<Fixtures & Options>`,** so specs see real page-object types.
9. **Test data gets named interfaces:** `Product`, `User`, `Customer`, `InvalidCustomerCase`, `InvalidLoginCase`.
10. **`fillField` takes a `label` argument.** Lint flagged that the refill note would have printed `[object Object]` for the locator.
11. **Docs keep the history but use today's file names.** §8's phase steps now name `.ts` files, with a note that Phases 1 to 9 were written in JavaScript.

## Tasks

1. **Tooling:** install `typescript@6.0.3` and `typescript-eslint@8.72.1`; add `tsconfig.json`, the `typecheck` script, and the CI step; rewrite `eslint.config.js` with `tseslint.config(...)`. Verify: a planted `loginPage.goto();` without `await` fails lint with `no-floating-promises`.
2. **Convert:** `git mv` all source to `.ts`, switch to `import`/`export`, add types. Update `playwright.config.ts` (`testMatch: /.*\.setup\.ts/`, reporter path `./reporters/allure.ts`) and `playwright.merge.config.ts`. Verify: `tsc`, lint and Prettier clean.
3. **Baselines:** move `visual.spec.js-snapshots` to `visual.spec.ts-snapshots` as pure renames. Verify: `git status` shows 16 `R` entries and no new PNGs.
4. **Full run:** all four projects. Expected: 264 passed, 5 skipped.
5. **Docs:** README (language, `typecheck`, a TypeScript section, the CI lint job) and `PROJECT_PLAN.md` (§1, §3, §4, §5 code samples, §7, §8, §9, §10, §11, §12).

## Findings during execution

- **The setup project's `testMatch` still said `.setup.js`.** Setup silently didn't run, and 203 tests failed against an expired saved session. Fixed in the config; it's the most convincing argument in this phase for running the whole suite after a "pure rename".
- **A failed run wrote fresh win32 baselines** into the new snapshot folder. They were deleted and the committed PNGs moved in instead, then verified.
- **A Firefox A11Y-08 timeout** in one full run passed 5 of 5 on rerun: the known local Firefox stall under 8 workers, not a migration fault.

## Results

- `npm run typecheck`, `npm run lint` and `npm run format:check` clean.
- Full local run: 264 passed, 5 skipped (2.0 min).
- Planted missing `await`: `@typescript-eslint/no-floating-promises` error, exit 1.

## Concepts to explain

- **Type-checking vs transpiling:** Playwright strips the types and runs the code; `tsc` only proves the types agree. A type error doesn't stop `npx playwright test`, which is why CI runs `tsc` separately.
- **Typed fixtures:** the type argument to `test.extend<...>` tells every spec what each fixture is.
- **Type-aware lint:** rules that need type information, such as "this call returns a Promise that nobody awaits".
- **`readonly` and `override`:** a test can't reassign a locator, and renaming `BasePage.goto` breaks the build instead of silently leaving a dead method.
