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
// GLOBAL FETCH MOCK
// ============================================================================

/**
 * Mock global fetch API for Jest environment
 * jsdom doesn't include fetch by default, so we need to polyfill it
 * This provides a basic mock that returns successful responses with appropriate data
 * Individual tests can override this mock if needed
 */
global.fetch = jest.fn((url) => {
  // Return a mock response that matches the expected structure
  const urlString =
    typeof url === 'string'
      ? url
      : url instanceof URL
        ? url.toString()
        : url?.url || '';

  // Determine mock data based on URL
  let mockData = {};
  if (urlString.includes('/api/streams/live-status')) {
    // Mock data for live stream status endpoint
    mockData = {
      twitch: { isLive: false },
      youtube: { isLive: false }
    };
  } else if (urlString.includes('/api/modrinth/stats')) {
    // Mock data for Modrinth stats endpoint
    mockData = {
      projects: {
        rituals: {
          formattedDownloads: '0'
        },
        strixunPackA: {
          formattedDownloads: '0'
        }
      }
    };
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(mockData),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
    redirected: false,
    type: 'default',
    url: urlString,
    clone: function () {
      return {
        ok: this.ok,
        status: this.status,
        statusText: this.statusText,
        json: this.json,
        text: this.text,
        blob: this.blob,
        arrayBuffer: this.arrayBuffer,
        headers: this.headers,
        redirected: this.redirected,
        type: this.type,
        url: this.url
      };
    }
  });
});

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

  // ============================================================================
  // PORTAL CONTAINER SETUP
  // ============================================================================

  /**
   * Create portal container for React Portal tests
   * This sets up the DOM element that createPortal() targets in tests
   */
  const setupPortalContainer = () => {
    // Create overlay portal container
    const overlayPortal = document.createElement('div');
    overlayPortal.id = 'overlay-portal';
    document.body.appendChild(overlayPortal);
  };

  // Setup portal container before each test
  beforeEach(() => {
    setupPortalContainer();
  });

  // Clean up portal container after each test
  afterEach(() => {
    const overlayPortal = document.getElementById('overlay-portal');
    if (overlayPortal) {
      document.body.removeChild(overlayPortal);
    }
  });
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
process.env.NODE_ENV = 'test'; // Ensure we're in test mode
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'; // Mock database URL

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
