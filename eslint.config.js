// Flat config (ESLint 9). Replaces the .eslintrc.yml + airbnb-base setup:
// airbnb-base is pinned to the legacy config format and to ESLint 8.
//
// Formatting is not ESLint's job here - prettier owns it, and
// eslint-config-prettier switches off every stylistic rule that would fight
// it. What is left are the rules that catch real mistakes.

const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

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
    rules: {
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // The card compiles user-supplied templates from the Lovelace config,
      // so one deliberate `new Function` stays - guarded by a disable comment.
      'no-new-func': 'error',
      'no-unused-vars': ['error', { args: 'after-used', ignoreRestSiblings: true }],
    },
  },
  prettier,
];
