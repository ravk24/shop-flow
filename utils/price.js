// Throws on anything unexpected, so a bad read can't become NaN inside a sort comparator.
function parsePrice(text) {
  const match = /^\$(\d+\.\d{2})$/.exec(text);
  if (!match) throw new Error(`Not a price: "${text}"`);
  return Number(match[1]);
}

function formatPrice(amount) {
  return `$${amount.toFixed(2)}`;
}

module.exports = { parsePrice, formatPrice };
