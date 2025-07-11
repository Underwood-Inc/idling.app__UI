/**
 * Text and Encoding API Mocks
 * 
 * Mocks for text-related APIs including TextEncoder, TextDecoder, and Headers
 * that are commonly used in React components for text processing.
 */

/**
 * Mock TextEncoder and TextDecoder
 */
export const mockTextEncodingAPIs = () => {
  /**
   * Mock TextEncoder
   * 
   * These are useful for testing text encoding/decoding
   */
  global.TextEncoder = jest.fn().mockImplementation(() => ({
    encode: jest.fn().mockReturnValue([72, 101, 108, 108, 111])
  }));

  /**
   * Mock TextDecoder
   */
  global.TextDecoder = jest.fn().mockImplementation(() => ({
    decode: jest.fn().mockReturnValue('Hello')
  }));
};

/**
 * Mock Headers API
 */
export const mockHeadersAPI = () => {
  /**
   * Mock Headers constructor
   * 
   * This is useful for testing HTTP headers
   */
  global.Headers = jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    set: jest.fn(),
    forEach: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn()
  }));
};

/**
 * Apply all text mocks
 */
export const mockTextAPIs = () => {
  mockTextEncodingAPIs();
  mockHeadersAPI();
}; 