/**
 * Essential Browser Window API Mocks
 * 
 * Only the minimal mocks that are actually needed and were working before
 */

/**
 * Mock window.matchMedia API
 * 
 * The matchMedia API is not available in the jsdom test environment, but many
 * components (especially responsive ones) rely on it. This mock provides a
 * basic implementation that returns consistent values for testing.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia
 */
export const mockMatchMedia = (): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
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
};

/**
 * Apply essential window mocks
 */
export const mockWindowAPIs = (): void => {
  mockMatchMedia();
}; 