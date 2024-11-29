const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './'
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/e2e', '\\.spec\\.ts$', '\\.d\\.ts$'],
  setupFilesAfterEnv: ['<rootDir>/src/jest.setup.js'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  projects: [
    {
      displayName: 'app',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      testPathIgnorePatterns: [
        '<rootDir>/e2e',
        '<rootDir>/custom-eslint-rules',
        '\\.spec\\.ts$',
        'dist'
      ],
      setupFilesAfterEnv: [
        '@testing-library/jest-dom',
        '<rootDir>/src/jest.setup.js'
      ],
      moduleNameMapper: {
        '^next/navigation$': '<rootDir>/__mocks__/next/navigation.ts'
      },
      testEnvironment: 'jest-environment-jsdom'
    },
    {
      displayName: 'eslint-rules',
      rootDir: 'custom-eslint-rules',
      testMatch: ['<rootDir>/rules/__tests__/**/*.test.ts'],
      testPathIgnorePatterns: ['dist'],
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            tsconfig: '<rootDir>/tsconfig.json'
          }
        ]
      },
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      moduleNameMapper: {
        '^@typescript-eslint/utils$': '@typescript-eslint/utils/dist/index.js'
      }
    }
  ]
};

module.exports = createJestConfig(customJestConfig);
