const js = require('@eslint/js');
const globals = require('globals');
const playwright = require('eslint-plugin-playwright');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['playwright-report/', 'test-results/', 'blob-report/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.js', 'pages/**/*.js', 'components/**/*.js', 'fixtures/**/*.js'],
    settings: { playwright: { globalAliases: { test: ['setup'] } } },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expectSortToWork'] }],
      'playwright/no-skipped-test': ['warn', { allowConditional: true }],
    },
  },
  prettier,
];
