import type { Page } from '@playwright/test';

type NoiseFilter = (text: string, url: string) => boolean;

// SauceDemo's telemetry endpoint. The `stubTelemetry` fixture answers it locally, so it logs nothing.
const TELEMETRY_URL = 'https://events.backtrace.io/**';

// The one error SauceDemo logs in normal use, on Chromium and WebKit only, which isn't a fault in the page:
// its server answers a direct visit to any .html page with a 404 status, and the app still renders.
// Kept narrow on purpose, so a resource that's really missing still counts.
function isKnownNoise(text: string, url: string): boolean {
  return text.includes('status of 404') && /\.html(\?|$)/.test(url);
}

// Collects the page's console errors and uncaught exceptions, minus the app's known noise.
// Limits: it watches this `page` only, can miss an error after a test's last action, and doesn't see alerts.
function watchPageErrors(page: Page, isNoise: NoiseFilter): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    const url = message.location().url;
    if (message.type() === 'error' && !isNoise(text, url)) {
      // A failed load's text doesn't say what failed; its location is the resource's URL.
      errors.push(text.startsWith('Failed to load resource') ? `${text} (${url})` : text);
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

export { isKnownNoise, watchPageErrors, TELEMETRY_URL };
export type { NoiseFilter };
