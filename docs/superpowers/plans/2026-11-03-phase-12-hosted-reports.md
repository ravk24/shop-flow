# Phase 12: Hosted Test Reports

**Goal:** Publish the latest `main` run's reports at https://shop-flow-wine.vercel.app, the Vercel project the owner created for this repo.

**Requested by the owner (2026-11-03):** "host the test reports there". Small enough to run as one task, executed inline.

## Recon

- The URL served Vercel's `404: NOT_FOUND` on every path. The project (`shop-flow`, team `ravi-kants-projects-3dfe462a`) was created from the GitHub repo with preset "Other": Vercel's Git integration deployed the bare repo, which has no `index.html` and no build output.
- CI already builds three reports per run: `playwright-report` and `allure-report` (job `merge-reports`) and `playwright-report-automationexercise` (job `automationexercise`), as artifacts. Sizes on `main`'s last run: 6.3 MB, 16 MB, 0.5 MB.
- A run with no retries has no `trace/` folder in the HTML report; Playwright only adds it when there are traces.

## What was built

- `scripts/build-report-site.js <reports folder>`: copies each report present into `.vercel/output/static/<route>/` (`playwright`, `allure`, `automationexercise`), writes a landing page naming the commit and CI run, and `config.json` (`{"version":3}`), Vercel's prebuilt layout.
- CI job `publish-reports`: pushes to `main` only, after `merge-reports` and `automationexercise`, even when tests failed; downloads the three artifacts, builds the site, and, if the run's commit is still `main`'s head, `vercel@59.3.0 deploy --prebuilt --prod`. Non-blocking, `concurrency` group so deploys run one at a time.
- `vercel.json`: `git.deploymentEnabled: false`, so Vercel's Git builds stop deploying the bare repo over the reports.
- `.vercel/` ignored by git, ESLint and Prettier.

## Rulings

1. Prebuilt deploy from CI, not a Vercel-side build. Vercel's build machines have no Playwright browsers and no access to the run's results. Cost if wrong: none found; the prebuilt deploy was verified live.
2. Publish only from `main` pushes. Branch and pull request reports stay artifacts; fork pull requests have no secrets anyway. Cost if wrong: a branch's report isn't browsable without downloading.
3. Publish after failing runs too: a red run's report is the one people need. A missing report is listed as unavailable rather than a dead link.
4. Non-blocking job, and a missing `VERCEL_TOKEN` only warns: hosting must never turn the test badge red. Cost if wrong: a broken deploy is noticed only in the job's annotations.
5. `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` inline in the workflow, not secrets: they identify, they don't authorize.
6. `vercel` CLI pinned to 59.3.0, the version verified locally.
7. The token is the owner's step. Creating a project-scoped token and writing it to the repo's secrets was blocked by the auto-mode classifier (secret-store write); no token was created.

## Review findings (fresh whole-branch review)

- **Important, fixed:** a single pattern download extracts into `reports/` itself when only one artifact matches (`download-artifact` v8 source), so that report was listed as unavailable. Now three named downloads, each into its own folder, `continue-on-error`.
- **Important, fixed:** `concurrency` serialises deploys but doesn't order them, so a slower older run (or a re-run) could deploy last. The deploy step now skips unless the run's commit is `main`'s head (`git ls-remote`); guards exercised locally (no token → warn, stale → notice, head → deploy). Comment and README corrected.
- **Minor, fixed:** with no report at all the script now fails ("No reports to publish") instead of deploying a page of unavailable cards (RED: exit 0 before the change; GREEN: exit 1). `/playwright` without a slash now 308-redirects (the report loads files by relative paths), verified live. Token scoped to the deploy step; redundant `--token` dropped. README bullet moved into the job list.
- **Minor, documented:** a deploy waiting in the concurrency group is dropped when a newer one arrives, so that run's conclusion shows as cancelled.

## Verification

- Script: no argument exits 1 with usage; a folder with only the Playwright report publishes it and lists the other two as unavailable; all three publish.
- Deployed `main`'s CI run 41494243256 reports with the same command CI uses (`vercel deploy --prebuilt --prod`, IDs from env). `/`, `/playwright/`, `/allure/`, `/automationexercise/` return 200 and render in Chromium with 0 console errors (267 passed, 5 skipped; Allure 269 results; 12 passed); an unknown path returns 404.
- Typecheck, lint and Prettier clean.

## Concepts

- **Artifacts vs hosting:** CI artifacts are private downloads that expire; a hosted report is a link anyone can open.
- **Prebuilt deployment:** build the files where the data is (CI), and let the host only serve them.
- **Secrets in CI:** the token is the only real secret; identifiers aren't. Least privilege: scope the token to the one project.
