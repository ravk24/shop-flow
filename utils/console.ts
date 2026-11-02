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

// automationexercise.com's ad and analytics hosts. Its fixture aborts every request to them.
const AD_HOSTS =
  /^https?:\/\/([^/]+\.)?(googlesyndication\.com|doubleclick\.net|adtrafficquality\.google|fundingchoicesmessages\.google\.com|cloudflareinsights\.com)\//;

// automationexercise.com logs three kinds of error that aren't faults in what we test:
// - every page loads Google Fonts stylesheets over http, which Chromium blocks as mixed content;
// - each ad request the fixture aborts logs a failed load, with the ad's URL as its location;
// - under load, the site sheds requests for its own resources (product pictures) with 502 or 503.
//   That's the same overload `AutomationExercisePage.goto` reports for a whole page (seen 2 times in 66 runs).
// Anything else still counts: a 404 or other failed load from the site, or an ad host missing from AD_HOSTS.
function isAutomationExerciseNoise(text: string, url: string): boolean {
  const blockedFont = text.startsWith('Mixed Content:') && text.includes("'http://fonts.googleapis.com/");
  const abortedAd = text.includes('net::ERR_FAILED') && AD_HOSTS.test(url);
  const sheddingLoad = /status of 50[23]\b/.test(text) && url.startsWith('https://automationexercise.com/');
  return blockedFont || abortedAd || sheddingLoad;
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

export { isKnownNoise, isAutomationExerciseNoise, watchPageErrors, AD_HOSTS, TELEMETRY_URL };
export type { NoiseFilter };
