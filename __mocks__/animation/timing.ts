/**
 * Animation and Timing API Mocks
 * 
 * Mocks for animation and timing-related APIs including requestAnimationFrame,
 * performance timing, and related functionality used in React components.
 */

/**
 * Mock requestAnimationFrame and cancelAnimationFrame
 */
export const mockAnimationFrameAPI = () => {
  /**
   * Mock requestAnimationFrame and cancelAnimationFrame
   * 
   * These are available in jsdom but we want to provide more control
   * over animation timing in tests
   */
  let frameId = 0;
  global.requestAnimationFrame = jest.fn((callback) => {
    frameId++;
    // In tests, we often want to control when animations run
    // So we'll store the callback but not call it automatically
    if (callback && typeof callback === 'function') {
      // Call immediately in tests for predictable behavior
      setTimeout(() => callback(performance.now()), 0);
    }
    return frameId;
  });

  global.cancelAnimationFrame = jest.fn();
};

/**
 * Mock performance API
 */
export const mockPerformanceAPI = () => {
  /**
   * Mock performance.now
   * 
   * This is useful for testing performance measurements and animations
   */
  if (!window.performance) {
    Object.defineProperty(window, 'performance', {
      writable: true,
      value: {}
    });
  }

  if (!window.performance.now) {
    Object.defineProperty(window.performance, 'now', {
      writable: true,
      value: jest.fn().mockReturnValue(Date.now())
    });
  }
};

/**
 * Apply all animation mocks
 */
export const mockAnimationAPIs = () => {
  mockAnimationFrameAPI();
  mockPerformanceAPI();
}; 