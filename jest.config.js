/**
 * Jest Configuration for Next.js Application
 * 
 * This configuration file sets up Jest for testing a Next.js application.
 * It handles module resolution, test discovery, coverage collection, and
 * environment setup specifically for unit and integration testing.
 * 
 * IMPORTANT: This configuration is for JEST ONLY - it explicitly excludes
 * Playwright E2E tests to maintain clean separation between testing frameworks.
 * 
 * @see https://jestjs.io/docs/configuration
 * @see https://nextjs.org/docs/testing/jest
 */

// ============================================================================
// NEXT.JS JEST INTEGRATION
// ============================================================================

/**
 * Import Next.js Jest configuration creator
 * This function creates a Jest configuration that's optimized for Next.js apps
 */
const nextJest = require('next/jest');

/**
 * Create the base Jest configuration for Next.js
 * This automatically handles:
 * - Next.js specific transformations
 * - CSS and asset imports
 * - Environment variables from .env files
 * - TypeScript compilation
 */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './'
});

// ============================================================================
// CUSTOM JEST CONFIGURATION
// ============================================================================

/**
 * Custom Jest configuration object
 * This extends the base Next.js configuration with project-specific settings
 */
const customJestConfig = {
  
  // ==========================================================================
  // SETUP AND ENVIRONMENT
  // ==========================================================================
  
  /**
   * Setup files that run after the test framework is installed
   * These files run before each test file and set up global mocks and utilities
   * 
   * @see jest.setup.js for the actual setup implementation
   */
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  /**
   * Test environment configuration
   * 'jsdom' simulates a browser environment for React component testing
   * This provides DOM APIs like document, window, etc.
   */
  testEnvironment: 'jsdom',
  
  /**
   * Setup files that run before the test framework is installed
   * These handle environment variables and other pre-test setup
   * 
   * @see jest.env.js for environment variable setup
   */
  setupFiles: ['<rootDir>/jest.env.js'],
  
  // ==========================================================================
  // MODULE RESOLUTION
  // ==========================================================================
  
  /**
   * Module name mapping for path aliases
   * Maps import paths to actual file locations, matching Next.js configuration
   * 
   * This allows imports like:
   * - import Component from '@/components/Component'
   * - import { helper } from '@/lib/utils'
   */
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',              // General @ alias
    '^@/components/(.*)$': '<rootDir>/src/components/$1',  // Components alias
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',      // Library code alias
    '^@/app/(.*)$': '<rootDir>/src/app/$1'       // App directory alias
  },
  
  /**
   * Transform ignore patterns
   * Specifies which node_modules should be transformed by Jest
   * Most node_modules are pre-compiled, but some (like next-auth) need transformation
   */
  transformIgnorePatterns: [
    'node_modules/(?!(next-auth|@auth/core))'  // Transform next-auth modules
  ],
  
  // ==========================================================================
  // TEST DISCOVERY AND FILTERING
  // ==========================================================================
  
  /**
   * Paths to ignore when looking for tests
   * This ensures Jest doesn't try to run:
   * - Next.js build artifacts
   * - Node modules
   * - Playwright E2E tests (complete separation)
   * - Test result artifacts
   */
  testPathIgnorePatterns: [
    '<rootDir>/.next/',           // Next.js build output
    '<rootDir>/node_modules/',    // Dependencies
    '<rootDir>/e2e/',             // Playwright E2E tests (IMPORTANT: Keep separate!)
    '<rootDir>/playwright-report/',  // Playwright reports
    '<rootDir>/test-results/',    // Playwright test results
    '\\.spec\\.(ts|tsx)$'         // .spec files (Playwright convention)
  ],
  
     /**
    * Test file patterns to match
    * Only run Jest tests, explicitly excluding Playwright files
    * 
    * Matches:
    * - src/slash-star-star/star.test.ts
    * - src/slash-star-star/star.test.tsx
    * - src/slash-star-star/slash-underscore-underscore-tests-underscore-underscore/star.ts
    * - src/slash-star-star/slash-underscore-underscore-tests-underscore-underscore/star.tsx
    */
  testMatch: [
    '<rootDir>/src/**/*.test.(ts|tsx|js|jsx)',        // Standard test files
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)' // Tests in __tests__ directories
  ],
  
  // ==========================================================================
  // COVERAGE CONFIGURATION
  // ==========================================================================
  
  /**
   * Files to include in coverage collection
   * Specifies which files should be analyzed for test coverage
   */
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',     // All source files
    '!src/**/*.d.ts',               // Exclude TypeScript declaration files
    '!src/**/*.stories.tsx',        // Exclude Storybook stories
    '!src/**/index.ts',             // Exclude index files (usually just exports)
    '!src/**/*.spec.{ts,tsx}',      // Exclude Playwright spec files
    '!e2e/**/*'                     // Exclude entire E2E directory
  ],
  
  /**
   * Coverage report formats
   * Generate multiple formats for different use cases:
   * - json: For programmatic access
   * - lcov: For coverage visualization tools
   * - text: For terminal output
   * - clover: For CI/CD integration
   */
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  
  // ==========================================================================
  // PERFORMANCE AND RELIABILITY
  // ==========================================================================
  
  /**
   * Test timeout in milliseconds
   * Increased timeout to handle database operations and async operations
   * Individual tests can override this with jest.setTimeout()
   */
  testTimeout: 15000,  // 15 seconds
  
  /**
   * Maximum number of worker processes
   * Set to 1 to prevent database connection conflicts and race conditions
   * This makes tests slower but more reliable, especially for integration tests
   */
  maxWorkers: 1,
  
  /**
   * Force Jest to exit after tests complete
   * Prevents Jest from hanging due to open handles (database connections, etc.)
   * This is especially important for integration tests that use real databases
   */
  forceExit: true,
  
  /**
   * Detect open handles that prevent Jest from exiting
   * Helps identify async operations that aren't properly cleaned up
   * Useful for debugging hanging tests
   */
  detectOpenHandles: true,
  
  // ==========================================================================
  // MOCK MANAGEMENT
  // ==========================================================================
  
  /**
   * Clear all mocks between tests
   * Ensures each test starts with fresh mock state
   * Prevents test pollution and improves test isolation
   */
  clearMocks: true,
  
  /**
   * Restore mocks to their original implementation after each test
   * Useful when you temporarily override mocks in specific tests
   */
  restoreMocks: true,
  
  // ==========================================================================
  // OUTPUT AND DEBUGGING
  // ==========================================================================
  
  /**
   * Verbose output configuration
   * Show detailed test results in development, concise output in CI
   * This helps with debugging locally while keeping CI logs clean
   */
  verbose: process.env.CI ? false : true
};

// ============================================================================
// CONFIGURATION EXPORT
// ============================================================================

/**
 * Export the final Jest configuration
 * 
 * The createJestConfig function merges our custom configuration with
 * Next.js-specific settings to create the final configuration object.
 * 
 * This configuration provides:
 * ✅ Next.js integration (automatic transforms, env vars, etc.)
 * ✅ TypeScript support
 * ✅ Path alias resolution matching Next.js config
 * ✅ Proper test discovery (Jest only, excludes Playwright)
 * ✅ Coverage collection from source files only
 * ✅ Reliable test execution (single worker, proper cleanup)
 * ✅ Development-friendly output
 * ✅ Mock management for clean test isolation
 * 
 * Framework Separation (slash = / & star = *):
 * - Jest tests: src/slash-star-star/star.test.{ts,tsx} (unit/integration)
 * - Playwright tests: e2e/slash-star-star/star.spec.ts (end-to-end)
 * - Never mix the two frameworks!
 */
module.exports = createJestConfig(customJestConfig);
