/**
 * Navigation API Mocks
 * 
 * Mocks for navigation-related APIs including location, navigator, and clipboard
 * that are commonly used in React components for navigation and user environment detection.
 */

/**
 * Mock window.location methods
 */
export const mockLocationAPI = () => {
  /**
   * Mock window.location methods
   * 
   * These are useful for testing navigation and URL manipulation
   */
  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      ...window.location,
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn()
    }
  });
};

/**
 * Mock navigator properties
 */
export const mockNavigatorAPI = () => {
  /**
   * Mock navigator.userAgent
   * 
   * This is useful for testing browser detection
   */
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    value: 'Mozilla/5.0 (Node.js) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });

  /**
   * Mock navigator.language
   * 
   * This is useful for testing internationalization
   */
  Object.defineProperty(navigator, 'language', {
    writable: true,
    value: 'en-US'
  });

  /**
   * Mock navigator.languages
   * 
   * This is useful for testing internationalization
   */
  Object.defineProperty(navigator, 'languages', {
    writable: true,
    value: ['en-US', 'en']
  });

  /**
   * Mock navigator.onLine
   * 
   * This is useful for testing offline functionality
   */
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true
  });

  /**
   * Mock navigator.cookieEnabled
   * 
   * This is useful for testing cookie functionality
   */
  Object.defineProperty(navigator, 'cookieEnabled', {
    writable: true,
    value: true
  });

  /**
   * Mock navigator.doNotTrack
   * 
   * This is useful for testing privacy features
   */
  Object.defineProperty(navigator, 'doNotTrack', {
    writable: true,
    value: null
  });
};

/**
 * Mock Clipboard API
 */
export const mockClipboardAPI = () => {
  /**
   * Mock Clipboard API
   * 
   * This is useful for testing clipboard operations
   */
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue(''),
        write: jest.fn().mockResolvedValue(undefined),
        read: jest.fn().mockResolvedValue([])
      }
    });
  }
};

/**
 * Apply all navigation mocks
 */
export const mockNavigationAPIs = () => {
  mockLocationAPI();
  mockNavigatorAPI();
  mockClipboardAPI();
}; 