/**
 * Events API Mocks
 *
 * Mocks for event-related APIs including CustomEvent, Event, and AbortController
 * that are commonly used in React components.
 */

/**
 * Mock CustomEvent
 */
export const mockCustomEventAPI = () => {
  /**
   * Mock CustomEvent constructor
   *
   * This is useful for testing custom events
   */
  global.CustomEvent = jest.fn().mockImplementation((type, options) => ({
    type,
    detail: options?.detail,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
    composed: options?.composed || false,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn()
  }));
};

/**
 * Mock Event
 */
export const mockEventAPI = () => {
  /**
   * Mock global Event constructor
   *
   * This is useful for testing events
   */
  // @ts-expect-error - Mock doesn't need full Event constructor interface
  global.Event = jest.fn().mockImplementation((type, options) => ({
    type,
    bubbles: options?.bubbles || false,
    cancelable: options?.cancelable || false,
    composed: options?.composed || false,
    target: null,
    currentTarget: null,
    eventPhase: 0,
    timeStamp: Date.now(),
    defaultPrevented: false,
    isTrusted: false,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    stopImmediatePropagation: jest.fn()
  }));
};

/**
 * Mock AbortController
 */
export const mockAbortControllerAPI = () => {
  /**
   * Mock AbortController constructor
   *
   * This is useful for testing request cancellation
   */
  global.AbortController = jest.fn().mockImplementation(() => ({
    abort: jest.fn(),
    signal: {
      aborted: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }
  }));
};

/**
 * Apply all events mocks
 */
export const mockEventsAPIs = () => {
  mockCustomEventAPI();
  mockEventAPI();
  mockAbortControllerAPI();
};
