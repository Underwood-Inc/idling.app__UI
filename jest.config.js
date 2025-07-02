const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './'
});

// Custom Jest configuration
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1'
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',           // Ignore ALL Playwright E2E tests
    '<rootDir>/playwright-report/',
    '<rootDir>/test-results/',
    '\\.spec\\.(ts|tsx)$'       // Ignore .spec files (Playwright convention)
  ],
  testMatch: [
    '<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',  // Only Jest tests in src/
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth/core))'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
    '!src/**/*.spec.{ts,tsx}',  // Exclude Playwright spec files
    '!e2e/**/*'                 // Exclude entire e2e directory
  ],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  testTimeout: 15000,  // Increased timeout for database operations
  maxWorkers: 1,       // Single worker to prevent database conflicts
  forceExit: true,     // Force exit after tests complete
  detectOpenHandles: true,  // Detect hanging async operations
  
  // Environment variables for tests
  setupFiles: ['<rootDir>/jest.env.js'],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Verbose output for debugging
  verbose: process.env.CI ? false : true
};

// Export the configuration
module.exports = createJestConfig(customJestConfig);
