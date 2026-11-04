// Regenerates the Linux screenshot baselines inside the same Playwright image CI runs in,
// so they match CI pixel for pixel. Needs Docker. The image tag follows the installed Playwright version.
const { spawnSync } = require('child_process');
const { version } = require('@playwright/test/package.json');

const image = `mcr.microsoft.com/playwright:v${version}-noble`;
const args = [
  'run',
  '--rm',
  '--ipc=host',
  '-v',
  `${process.cwd()}:/work`,
  // Keeps the container's Linux node_modules apart from the host's.
  '-v',
  '/work/node_modules',
  '-w',
  '/work',
  image,
  '/bin/bash',
  '-c',
  // --reporter=list keeps the run from touching the host's HTML report.
  // The container runs as root, so on a Linux host the written PNGs are owned by root.
  'npm ci && npx playwright test --grep @visual --update-snapshots=all --reporter=list',
];

console.log(`docker ${args.join(' ')}`);
const result = spawnSync('docker', args, { stdio: 'inherit' });
if (result.error) {
  console.error(`Could not run docker: ${result.error.message}. Is Docker installed and running?`);
}
process.exit(result.status ?? 1);
