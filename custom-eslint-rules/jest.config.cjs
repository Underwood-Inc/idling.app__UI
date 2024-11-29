/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/rules/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: ['node_modules', 'dist', '\\.d\\.ts$'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json'
      }
    ]
  },
  moduleNameMapper: {
    '^@typescript-eslint/utils$': require.resolve('@typescript-eslint/utils')
  }
};
