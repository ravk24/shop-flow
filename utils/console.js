// SauceDemo's telemetry endpoint. The `stubTelemetry` fixture answers it locally, so it logs nothing.
const TELEMETRY_URL = 'https://events.backtrace.io/**';

// The one error SauceDemo logs in normal use, on Chromium and WebKit only, which isn't a fault in the page:
// its server answers a direct visit to any .html page with a 404 status, and the app still renders.
// Kept narrow on purpose, so a resource that's really missing still counts.
function isKnownNoise(text, url) {
  return text.includes('status of 404') && /\.html(\?|$)/.test(url);
}

module.exports = { isKnownNoise, TELEMETRY_URL };
