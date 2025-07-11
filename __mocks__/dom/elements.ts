/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Essential DOM Observer API Mocks
 * 
 * Only the minimal observer APIs that were originally mocked and needed
 */

/**
 * Mock observer APIs that are commonly used but not available in jsdom
 */
export const mockObserverAPIs = (): void => {
  /**
   * Mock IntersectionObserver
   */
  global.IntersectionObserver = jest.fn().mockImplementation((callback: (entries: IntersectionObserverEntry[]) => void) => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn()
  }));

  /**
   * Mock ResizeObserver
   */
  global.ResizeObserver = jest.fn().mockImplementation((callback: (entries: ResizeObserverEntry[]) => void) => ({
    observe: jest.fn(),
    disconnect: jest.fn(),
    unobserve: jest.fn()
  }));
};

/**
 * Apply essential DOM mocks
 */
export const mockDOMAPIs = (): void => {
  mockObserverAPIs();
}; 