// Flat config (ESLint 9). Replaces the .eslintrc.yml + airbnb-base setup:
// airbnb-base is pinned to the legacy config format and to ESLint 8.
//
// Formatting is not ESLint's job here - prettier owns it, and
// eslint-config-prettier switches off every stylistic rule that would fight
// it. What is left are the rules that catch real mistakes.

const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

// Shared by the card and the tests. `no-console` is relaxed for the build
// scripts below, which exist to print.
const rules = {
  eqeqeq: ['error', 'smart'],
  'no-var': 'error',
  'prefer-const': 'error',
  'no-console': ['warn', { allow: ['warn', 'error'] }],
  // The card compiles user-supplied templates from the Lovelace config,
  // so one deliberate `new Function` stays - guarded by a disable comment.
  'no-new-func': 'error',
  'no-unused-vars': ['error', { args: 'after-used', ignoreRestSiblings: true }],
};

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'rollup-plugins/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // The model configurations under src/configurations are evaluated with
        // `this` bound to the card (see moduleContext in rollup.config.js), so
        // they legitimately reference card helpers.
        MiniHumidifier: 'readonly',
      },
    },
    rules,
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      // Browser globals for the files that ask for a jsdom environment, node
      // globals for the rest. vitest is imported explicitly, not global.
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules,
  },
  {
    files: ['test/browser/**/*.js'],
    languageOptions: {
      // The browser tests run under mocha, which @web/test-runner puts in the
      // page: `describe` and `it` are globals there, where vitest's are
      // imported.
      globals: globals.mocha,
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...rules,
      // These scripts report to the terminal.
      'no-console': 'off',
    },
  },
  prettier,
];
