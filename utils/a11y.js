// The gate: WCAG 2.0, 2.1 and 2.2 rules at levels A and AA. Best-practice rules are left out on purpose (see README).
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

// One line per violation, so a failing assertion names the rule and where it fired.
function describeViolations(violations) {
  return violations.map((violation) => `${violation.id}: ${violation.nodes[0].target.join(' ')}`);
}

module.exports = { WCAG_TAGS, describeViolations };
