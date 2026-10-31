// Single source of credentials. SauceDemo's users are public, but reading them
// from the environment keeps the framework pattern correct for real targets.
const password = process.env.PASSWORD || 'secret_sauce';

const users = {
  standard: { username: process.env.STANDARD_USER || 'standard_user', password },
  lockedOut: { username: process.env.LOCKED_OUT_USER || 'locked_out_user', password },
  problem: { username: process.env.PROBLEM_USER || 'problem_user', password },
  performanceGlitch: { username: process.env.PERFORMANCE_GLITCH_USER || 'performance_glitch_user', password },
};

module.exports = { users };
