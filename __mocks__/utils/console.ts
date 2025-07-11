/**
 * Console Mock Utilities
 * 
 * Utilities for mocking console methods while preserving output visibility.
 * This allows tests to verify console calls without losing debugging information.
 */

/**
 * Mock console methods to track calls but still show output
 */
export const mockConsoleAPIs = () => {
  /**
   * Store original console methods so we can restore them later
   */
  const originalConsole = { ...console };
  
  /**
   * Mock console methods while preserving output
   * 
   * This is useful for testing logging behavior while maintaining
   * the ability to see console output during test development
   */
  global.console = {
    ...console,
    log: jest.fn((...args) => originalConsole.log(...args)),
    warn: jest.fn((...args) => originalConsole.warn(...args)),
    error: jest.fn((...args) => originalConsole.error(...args)),
    info: jest.fn((...args) => originalConsole.info(...args)),
    debug: jest.fn((...args) => originalConsole.debug(...args))
  };
};

/**
 * Suppress console output for specific test cases
 */
export const suppressConsoleOutput = () => {
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };
};

/**
 * Clear all console mock calls
 */
export const clearConsoleMocks = () => {
  // eslint-disable-next-line no-console
  Object.keys(console).forEach(method => {
    // eslint-disable-next-line no-console
    if (jest.isMockFunction(console[method])) {
      // eslint-disable-next-line no-console
      console[method].mockClear();
    }
  });
}; 