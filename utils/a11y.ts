import type AxeBuilder from '@axe-core/playwright';

// axe-core's own types, reached through @axe-core/playwright so axe-core needn't be a direct dependency.
type Violation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

// The gate: WCAG 2.0, 2.1 and 2.2 rules at levels A and AA. Best-practice rules are left out on purpose (see README).
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// One line per violation, so a failing assertion names the rule and where it fired.
function describeViolations(violations: Violation[]): string[] {
  return violations.map((violation) => `${violation.id}: ${violation.nodes[0].target.join(' ')}`);
}

export { WCAG_TAGS, describeViolations };
