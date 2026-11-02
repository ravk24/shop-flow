// Throws on anything unexpected, so a bad read can't become NaN inside a sort comparator.
import type { Product } from '../data/products';

function parsePrice(text: string): number {
  const match = /^\$(\d+\.\d{2})$/.exec(text);
  if (!match) throw new Error(`Not a price: "${text}"`);
  return Number(match[1]);
}

function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// SauceDemo charges 8% tax on the item total (checked against all 63 possible carts).
const TAX_RATE = 0.08;

// Works in whole cents, because adding prices as floats drifts: 9.99 + 49.99 is 59.980000000000004.
function orderTotals(items: Pick<Product, 'price'>[]): { subtotal: number; tax: number; total: number } {
  const cents = items.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
  const taxCents = Math.round(cents * TAX_RATE);
  return {
    subtotal: cents / 100,
    tax: taxCents / 100,
    total: (cents + taxCents) / 100,
  };
}

// Reads the amount from labels like "Tax: $3.20". SauceDemo shows the item total as a raw float
// for some carts ("Item total: $59.980000000000004"), so the amount is rounded to cents.
// The display bug itself is tracked by its own test.
function parseLabelAmount(text: string): number {
  const match = /\$(\d+(?:\.\d+)?)$/.exec(text.trim());
  if (!match) throw new Error(`No amount in label: "${text}"`);
  return Math.round(Number(match[1]) * 100) / 100;
}

export { parsePrice, formatPrice, orderTotals, parseLabelAmount };
