/**
 * Crypto API Mocks
 * 
 * Mocks for crypto-related APIs including crypto.getRandomValues
 * that are commonly used in React components for security features.
 */

/**
 * Mock crypto.getRandomValues
 */
export const mockCryptoAPI = () => {
  /**
   * Mock crypto.getRandomValues
   * 
   * This is useful for testing UUID generation and other crypto operations
   */
  if (!window.crypto) {
    Object.defineProperty(window, 'crypto', {
      writable: true,
      value: {}
    });
  }

  if (!window.crypto.getRandomValues) {
    Object.defineProperty(window.crypto, 'getRandomValues', {
      writable: true,
      value: jest.fn().mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      })
    });
  }
};

/**
 * Apply all crypto mocks
 */
export const mockCryptoAPIs = () => {
  mockCryptoAPI();
}; 