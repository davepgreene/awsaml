module.exports = {
  env: {
    node: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/core-modules': [
      'electron',
      'electron-packager',
      'electron-devtools-installer',
    ],
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  extends: [
    'airbnb',
  ],
  globals: {
    require: true,
    process: true,
    __dirname: true,
    console: true,
    Storage: true,
    Manager: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },
  rules: {
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx', '.tsx'] }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: true,
    }],
    'import/extensions': ['error', 'ignorePackages', {
      js: 'never',
      jsx: 'never',
      ts: 'never',
      tsx: 'never',
    }],
    'linebreak-style': ['error', process.platform === 'win32' ? 'windows' : 'unix'],
    'global-require': 0,
  },
  overrides: [
    {
      files: 'api/**/*.js',
      extends: ['plugin:node/recommended'],
    },
    {
      files: 'test/**/*.js',
      env: {
        'jest/globals': true,
      },
      plugins: ['jest'],
      parserOptions: {
        sourceType: 'module',
      },
      rules: {
        'func-names': 0,
        'prefer-arrow-callback': 0,
        'max-nested-callbacks': 0,
        'space-before-function-paren': 0,
      },
    },
    {
      files: ['src/**/*.js', 'src/**/*.jsx'],
      env: {
        browser: true,
      },
      plugins: [
        'react-hooks',
      ],
    },
    {
      files: ['src/renderer/**/*.ts', 'src/renderer/**/*.tsx'],
      env: {
        browser: true,
      },
      parser: '@typescript-eslint/parser',
      plugins: [
        'react-hooks',
        '@typescript-eslint',
      ],
      extends: [
        'airbnb',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        'react/require-default-props': 'off',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      },
    },
  ],
};
