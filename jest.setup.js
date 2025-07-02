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
// BROWSER API MOCKS
// ============================================================================

/**
 * Mock window.matchMedia API
 * 
 * The matchMedia API is not available in the jsdom test environment, but many
 * components (especially responsive ones) rely on it. This mock provides a
 * basic implementation that returns consistent values for testing.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,           // Always returns false for consistent testing
    media: query,            // Returns the query string that was passed
    onchange: null,          // Event handler (legacy)
    addListener: jest.fn(),  // Legacy method (deprecated)
    removeListener: jest.fn(), // Legacy method (deprecated)
    addEventListener: jest.fn(),    // Modern event listener
    removeEventListener: jest.fn(), // Modern event listener
    dispatchEvent: jest.fn()       // Event dispatch method
  }))
});

/**
 * Mock ResizeObserver API
 * 
 * ResizeObserver is used to observe changes to element dimensions. It's not
 * available in jsdom, so we provide a mock implementation to prevent errors
 * in components that use it (like responsive layouts, charts, etc.).
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),    // Mock method to observe an element
  unobserve: jest.fn(),  // Mock method to stop observing an element
  disconnect: jest.fn()  // Mock method to stop observing all elements
}));

/**
 * Mock IntersectionObserver API
 * 
 * IntersectionObserver is used for lazy loading, infinite scrolling, and
 * visibility detection. It's not available in jsdom, so we mock it to
 * prevent errors in components that use these features.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver
 */
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),    // Mock method to start observing an element
  unobserve: jest.fn(),  // Mock method to stop observing an element
  disconnect: jest.fn()  // Mock method to stop observing all elements
}));

// ============================================================================
// NEXT.JS FRAMEWORK MOCKS
// ============================================================================

/**
 * Mock Next.js Navigation Hooks
 * 
 * Next.js provides several hooks for navigation (useRouter, usePathname, etc.)
 * that rely on the Next.js runtime. In Jest tests, we need to mock these to
 * provide predictable behavior and prevent errors.
 * 
 * @see https://nextjs.org/docs/app/api-reference/functions/use-router
 */
jest.mock('next/navigation', () => ({
  /**
   * Mock useRouter hook
   * Returns a mock router object with all the standard methods
   */
  useRouter: () => ({
    push: jest.fn(),      // Navigate to a new route
    replace: jest.fn(),   // Replace current route
    prefetch: jest.fn(),  // Prefetch a route
    back: jest.fn(),      // Go back in history
    forward: jest.fn(),   // Go forward in history
    refresh: jest.fn()    // Refresh the current page
  }),
  
  /**
   * Mock usePathname hook
   * Always returns '/' for consistent testing
   */
  usePathname: () => '/',
  
  /**
   * Mock useSearchParams hook
   * Returns a mock URLSearchParams-like object
   */
  useSearchParams: () => ({
    get: jest.fn(),       // Get a parameter value
    getAll: jest.fn(),    // Get all values for a parameter
    has: jest.fn(),       // Check if parameter exists
    keys: jest.fn(),      // Get all parameter names
    values: jest.fn(),    // Get all parameter values
    entries: jest.fn(),   // Get all parameter entries
    forEach: jest.fn(),   // Iterate over parameters
    toString: () => ''    // Convert to string
  })
}));

// ============================================================================
// AUTHENTICATION MOCKS
// ============================================================================

/**
 * Mock NextAuth.js Authentication
 * 
 * NextAuth provides authentication hooks and components. In tests, we mock
 * these to provide a consistent unauthenticated state unless specifically
 * overridden in individual tests.
 * 
 * @see https://next-auth.js.org/getting-started/client
 */
jest.mock('next-auth/react', () => ({
  /**
   * Mock useSession hook
   * Returns an unauthenticated session by default
   */
  useSession: () => ({
    data: null,                    // No user data
    status: 'unauthenticated'      // User is not logged in
  }),
  
  /**
   * Mock authentication functions
   */
  signIn: jest.fn(),              // Mock sign in function
  signOut: jest.fn(),             // Mock sign out function
  
  /**
   * Mock SessionProvider component
   * Simply renders children without any session context
   */
  SessionProvider: ({ children }) => children
}));

// ============================================================================
// THIRD-PARTY LIBRARY MOCKS
// ============================================================================

/**
 * Mock DiceBear Avatar Library
 * 
 * DiceBear is used for generating avatar images. In tests, we don't need
 * actual avatar generation, so we mock it to return predictable values.
 * 
 * @see https://www.dicebear.com/
 */

/**
 * Mock DiceBear collection (avatar styles)
 */
jest.mock('@dicebear/collection', () => ({
  lorelei: jest.fn()  // Mock the lorelei avatar style
}));

/**
 * Mock DiceBear core (avatar creation)
 */
jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({
    toString: () => '<svg>mock avatar</svg>'  // Return mock SVG string
  }))
}));

// ============================================================================
// DATABASE MOCKING STRATEGY
// ============================================================================

/**
 * Database Mocking Strategy
 * 
 * We intentionally do NOT mock the database globally here because:
 * 1. Not all tests need database mocking
 * 2. Different tests may need different mock behaviors
 * 3. Global mocks can cause conflicts and unexpected behavior
 * 
 * Instead, each test file that needs database mocking should include:
 * 
 * jest.mock('../../lib/db', () => ({
 *   __esModule: true,
 *   default: {
 *     unsafe: jest.fn().mockResolvedValue([])
 *   }
 * }));
 * 
 * This approach provides:
 * - Better test isolation
 * - More predictable behavior
 * - Easier debugging when tests fail
 * - Flexibility for different mock scenarios
 */

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
// CONSOLE OUTPUT MANAGEMENT
// ============================================================================

/**
 * Console Output Suppression
 * 
 * During testing, we want to suppress certain console warnings and errors
 * that are expected or not relevant to our tests. This keeps the test output
 * clean and focused on actual test failures.
 */

// Store original console methods so we can restore them later
const originalError = console.error;
const originalWarn = console.warn;

/**
 * Setup console suppression before all tests run
 */
beforeAll(() => {
  /**
   * Filter console.error calls
   * Suppress known React warnings that aren't relevant to our tests
   */
  console.error = (...args) => {
    // Check if the first argument is a string and contains known warnings
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: An invalid form control') ||
        args[0].includes('Warning: componentWillReceiveProps') ||
        args[0].includes('act(...)'))
    ) {
      return; // Suppress these warnings
    }
    // For all other errors, use the original console.error
    originalError.call(console, ...args);
  };

  /**
   * Filter console.warn calls
   * Suppress React deprecation warnings that aren't actionable in tests
   */
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('act(...)'))
    ) {
      return; // Suppress these warnings
    }
    // For all other warnings, use the original console.warn
    originalWarn.call(console, ...args);
  };
});

/**
 * Restore original console methods after all tests complete
 * This ensures that console output works normally outside of tests
 */
afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

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
 * Setup Complete
 * 
 * This setup file provides:
 * ✅ Browser API mocks (matchMedia, ResizeObserver, IntersectionObserver)
 * ✅ Next.js framework mocks (navigation, routing)
 * ✅ Authentication mocks (NextAuth)
 * ✅ Third-party library mocks (DiceBear avatars)
 * ✅ Clean console output (suppressed irrelevant warnings)
 * ✅ Consistent test environment variables
 * ✅ Reasonable test timeout defaults
 * 
 * Individual test files can:
 * - Override any of these mocks for specific test scenarios
 * - Add additional mocks as needed
 * - Mock the database layer when required
 * 
 * Remember: This setup is for JEST ONLY - keep it separate from Playwright!
 */
