// Builds the static site that CI deploys to Vercel: a landing page plus the run's reports, in Vercel's
// prebuilt output layout (.vercel/output), so Vercel serves the files as they are and runs no build.
// Usage: node scripts/build-report-site.js <folder holding the downloaded report folders>
const fs = require('fs');
const path = require('path');

const REPORTS = [
  { dir: 'playwright-report', route: 'playwright', title: 'Playwright report', about: 'SauceDemo, 4 browser projects' },
  { dir: 'allure-report', route: 'allure', title: 'Allure report', about: 'SauceDemo, with trends across runs' },
  {
    dir: 'playwright-report-automationexercise',
    route: 'automationexercise',
    title: 'automationexercise.com report',
    about: 'Second app, non-blocking',
  },
];

const escapeHtml = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function main() {
  const source = process.argv[2];
  if (!source) {
    console.error('Usage: node scripts/build-report-site.js <reports folder>');
    process.exit(1);
  }
  // With no report at all, fail instead of replacing the live site with a page of unavailable cards.
  const found = REPORTS.filter((report) => fs.existsSync(path.join(source, report.dir, 'index.html')));
  if (found.length === 0) {
    console.error(`No reports to publish: none of ${REPORTS.map((r) => r.dir).join(', ')} found in ${source}`);
    process.exit(1);
  }
  const output = path.resolve('.vercel', 'output');
  const site = path.join(output, 'static');
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(site, { recursive: true });

  // A report can be missing, e.g. when its job failed before uploading; the page says so instead of a dead link.
  const items = REPORTS.map((report) => {
    const from = path.join(source, report.dir);
    const present = fs.existsSync(path.join(from, 'index.html'));
    if (present) fs.cpSync(from, path.join(site, report.route), { recursive: true });
    console.log(`${report.dir}: ${present ? `published at /${report.route}/` : 'missing, listed as unavailable'}`);
    return { ...report, present };
  });

  fs.writeFileSync(path.join(site, 'index.html'), landingPage(items, runInfo()));
  // The reports load their files by relative paths, so /playwright must redirect to /playwright/.
  const routes = [
    { src: `^/(${REPORTS.map((r) => r.route).join('|')})$`, status: 308, headers: { Location: '/$1/' } },
    { handle: 'filesystem' },
  ];
  fs.writeFileSync(path.join(output, 'config.json'), JSON.stringify({ version: 3, routes }));
  console.log(`Site written to ${output}`);
}

// Which commit and CI run the reports come from, from GitHub Actions' environment.
function runInfo() {
  const { GITHUB_SHA, GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;
  return {
    commit: GITHUB_SHA ? GITHUB_SHA.slice(0, 7) : 'local build',
    commitUrl: GITHUB_SHA ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}` : null,
    runUrl: GITHUB_RUN_ID ? `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : null,
    builtAt: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
  };
}

function landingPage(items, run) {
  const link = (url, text) => (url ? `<a href="${escapeHtml(url)}">${escapeHtml(text)}</a>` : escapeHtml(text));
  const cards = items
    .map((item) =>
      item.present
        ? `<a class="card" href="/${item.route}/"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.about)}</span></a>`
        : `<div class="card off"><strong>${escapeHtml(item.title)}</strong><span>Not available for this run</span></div>`,
    )
    .join('\n      ');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ShopFlow test reports - by Ravi Kant</title>
    <style>
      :root { --bg: #f7f7f8; --fg: #1d1d1f; --muted: #5f6368; --card: #fff; --line: #dadce0; --accent: #2a6edb; }
      @media (prefers-color-scheme: dark) {
        :root { --bg: #17181a; --fg: #ececec; --muted: #a0a4a8; --card: #222326; --line: #3a3c40; --accent: #7aa7ff; }
      }
      body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, sans-serif; }
      main { max-width: 720px; margin: 0 auto; padding: 48px 16px; }
      h1 { margin: 0 0 4px; font-size: 1.6rem; }
      p { margin: 0 0 24px; color: var(--muted); }
      a { color: var(--accent); }
      .cards { display: grid; gap: 12px; }
      .card { display: flex; flex-direction: column; padding: 16px 20px; background: var(--card);
              border: 1px solid var(--line); border-radius: 10px; color: var(--fg); text-decoration: none; }
      a.card:hover { border-color: var(--accent); }
      .card span { color: var(--muted); font-size: 0.9rem; }
      .card.off { opacity: 0.6; }
      footer { margin-top: 32px; color: var(--muted); font-size: 0.85rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>ShopFlow test reports - by Ravi Kant</h1>
      <p>Latest run on <code>main</code> of the <a href="https://github.com/ravk24/shop-flow">ShopFlow</a> Playwright framework.</p>
      <div class="cards">
      ${cards}
      </div>
      <footer>Commit ${link(run.commitUrl, run.commit)} · ${link(run.runUrl, run.runUrl ? 'CI run' : 'no CI run')} · built ${escapeHtml(run.builtAt)}</footer>
    </main>
  </body>
</html>
`;
}

main();
