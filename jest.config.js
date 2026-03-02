const { createDefaultEsmPreset } = require('ts-jest');

const tsJestTransformCfg = createDefaultEsmPreset({
  tsconfig: 'tsconfig.test.json',
}).transform;

/** @type {import("jest").Config} **/
module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
    testMatch: [
    '**/test/**/*.ts',
  ],
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  transform: {
    ...tsJestTransformCfg,
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  reporters: [
    'default',
    ['jest-junit', { outputName: 'test-results.xml' }],
  ],
};
