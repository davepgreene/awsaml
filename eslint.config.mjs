import js from '@eslint/js';
import { fixupPluginRules } from "@eslint/compat";
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import jestPlugin from 'eslint-plugin-jest';

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
    files: ['*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
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
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...jestPlugin.environments.globals.globals,
        __dirname: 'readonly',
        process: 'readonly',
        NodeJS: 'readonly',
      }
    },
    plugins: {
      jest: jestPlugin,
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/renderer/**/*.ts', 'src/renderer/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.browser,
        process: 'readonly',
        React: 'readonly'
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      react: fixupPluginRules(reactPlugin),
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },
  {
    files: ['src/main/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        Storage: 'writable',
        Manager: 'writable',
        NodeJS: 'readonly',
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
