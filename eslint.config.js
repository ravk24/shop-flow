const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');
const playwright = require('eslint-plugin-playwright');
const prettier = require('eslint-config-prettier');

module.exports = tseslint.config(
  {
    ignores: [
      'playwright-report/',
      'playwright-report-automationexercise/',
      'test-results/',
      'blob-report/',
      'allure-results/',
      'allure-report/',
      'allure-history/',
    ],
  },
  js.configs.recommended,
  {
    // The few files that stay JavaScript: this config and the Docker script, both run directly by Node.
    files: ['**/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    // Type-aware rules, so a forgotten `await` on a Playwright call (no-floating-promises) is a lint error.
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: __dirname },
      globals: globals.node,
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts', 'tests-automationexercise/**/*.ts', 'pages/**/*.ts', 'components/**/*.ts', 'fixtures/**/*.ts'],
    settings: { playwright: { globalAliases: { test: ['setup'] } } },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expectSortToWork', 'expectNoViolations'] }],
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
    },
  },
  prettier,
);
