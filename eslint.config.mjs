import js from '@eslint/js';
import { fixupPluginRules } from "@eslint/compat";
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';
import nodePlugin from 'eslint-plugin-node';

export default [
  js.configs.recommended,
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**'],
  },
  {
    files: ['eslint.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        Storage: 'writable',
        Manager: 'writable',
      },
    },
    plugins: {
      import: fixupPluginRules(importPlugin),
      react: fixupPluginRules(reactPlugin),
    },
    settings: {
      react: { version: 'detect' },
      'import/core-modules': ['electron', 'electron-packager', 'electron-devtools-installer'],
      'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
    },
    rules: {
      quotes: ['error', 'single'],
      'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.tsx'] }],
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' }],
      'linebreak-style': ['error', process.platform === 'win32' ? 'windows' : 'unix'],
      'global-require': 0,
    },
  },
  {
    files: ['api/**/*.js'],
    plugins: { node: nodePlugin },
    rules: { ...nodePlugin.configs.recommended.rules },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.jest,
    },
    plugins: { jest: jestPlugin },
    rules: {
      'func-names': 0,
      'prefer-arrow-callback': 0,
      'max-nested-callbacks': 0,
      'space-before-function-paren': 0,
    },
  },
  {
    files: ['src/**/*.js', 'src/**/*.jsx'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooksPlugin },
  },
  {
    files: ['src/renderer/**/*.ts', 'src/renderer/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: { ...globals.browser, process: 'readonly', React: 'readonly' },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      react: fixupPluginRules(reactPlugin),
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      quotes: ['error', 'single'],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }],
      'react/require-default-props': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/main/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: globals.node,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      quotes: ['error', 'single'],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
