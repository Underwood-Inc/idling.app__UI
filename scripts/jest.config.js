/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest for TypeScript files
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  // Only test migration-related files
  testMatch: [
    '<rootDir>/**/*.test.ts'
  ],
  // Use node environment since we're testing backend scripts
  testEnvironment: 'node',
  // Module name mapping if needed
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  // Optional: Collect coverage for migrations
  collectCoverageFrom: [
    'scripts/**/*.ts',
    '!scripts/**/*.test.ts'
  ]
}; 