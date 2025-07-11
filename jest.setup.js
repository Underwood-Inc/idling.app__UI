/**
 * Jest Global Setup Configuration
 * 
 * This file runs before each test file in the Jest test suite and sets up the global
 * testing environment. It configures mocks, polyfills, and test utilities that are
 * needed across all test files.
 * 
 * IMPORTANT: This file is for JEST ONLY - do not import Playwright or other E2E
 * testing frameworks here as they are completely separate testing environments.
 * 
 * @see https://jestjs.io/docs/configuration#setupfilesafterenv
 */

// ============================================================================
// TESTING LIBRARY IMPORTS
// ============================================================================

/**
 * Jest DOM matchers for better assertions
 * Provides custom matchers like toBeInTheDocument(), toHaveClass(), etc.
 * @see https://github.com/testing-library/jest-dom
 */
import '@testing-library/jest-dom';

/**
 * Jest Chain for chaining assertions
 * Allows writing assertions like: expect(element).toBeVisible().and.toHaveClass('active')
 * @see https://github.com/mattphillips/jest-chain
 */
import 'jest-chain';

// ============================================================================
// ESSENTIAL MOCK IMPORTS
// ============================================================================

/**
 * Import only essential mock functions that were working before
 */
import { mockEssentialBrowserAPIs } from './__mocks__/index';

// ============================================================================
// BROWSER API MOCKS (JSDOM ENVIRONMENT ONLY)
// ============================================================================

/**
 * Essential browser API mocks that are only needed in jsdom environment
 * These will be skipped for Node.js environment tests (e.g., API tests)
 */
if (typeof window !== 'undefined') {
  // Apply only essential browser environment mocks
  mockEssentialBrowserAPIs();
}

// ============================================================================
// TEST ENVIRONMENT CONFIGURATION
// ============================================================================

/**
 * Environment Variables for Tests
 * 
 * Set up environment variables that are commonly needed across tests.
 * These provide a consistent test environment and prevent errors from
 * missing environment variables.
 */
process.env.NODE_ENV = 'test';  // Ensure we're in test mode
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';  // Mock database URL

// ============================================================================
// JEST CONFIGURATION
// ============================================================================

/**
 * Global Test Timeout
 * 
 * Set a reasonable timeout for all tests. This prevents tests from hanging
 * indefinitely if there are async operations that don't complete.
 * 
 * 10 seconds should be sufficient for most unit and integration tests.
 * Individual tests can override this with jest.setTimeout() if needed.
 */
jest.setTimeout(10000);

/**
 * Setup complete - essential mocks configured
 */
