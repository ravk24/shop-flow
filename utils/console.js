// Errors SauceDemo logs in normal use, on Chromium and WebKit only. Neither is a fault in the page:
// - Its telemetry posts to events.backtrace.io with placeholder credentials and gets a 401.
// - Its server answers a direct visit to any .html page with a 404 status, and the app still renders.
// Kept narrow on purpose, so a resource that's really missing still counts.
function isKnownNoise(text, url) {
  const isTelemetry = url.includes('events.backtrace.io');
  const isDirectVisit = text.includes('status of 404') && /\.html(\?|$)/.test(url);
  return isTelemetry || isDirectVisit;
}

module.exports = { isKnownNoise };
