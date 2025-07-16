/**
 * Storage API Mocks
 *
 * Mocks for storage-related APIs including localStorage, sessionStorage, and file APIs
 * that are commonly used in React components but need proper mocking in tests.
 */

/**
 * Mock localStorage and sessionStorage
 */
export const mockWebStorage = () => {
  /**
   * Mock localStorage
   *
   * jsdom provides these but we want to ensure they're properly mocked
   * and can be controlled in tests
   */
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0
  };

  /**
   * Mock sessionStorage
   */
  const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    length: 0
  };

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: localStorageMock
  });

  Object.defineProperty(window, 'sessionStorage', {
    writable: true,
    value: sessionStorageMock
  });
};

/**
 * Mock File API
 */
export const mockFileAPI = () => {
  /**
   * Mock File constructor
   *
   * These are useful for testing file upload functionality
   */
  global.File = jest.fn().mockImplementation((bits, filename, options) => ({
    name: filename,
    size: bits ? bits.length : 0,
    type: options?.type || 'text/plain',
    lastModified: Date.now(),
    webkitRelativePath: '',
    stream: jest.fn(),
    text: jest.fn().mockResolvedValue('mock text content'),
    arrayBuffer: jest.fn().mockResolvedValue({}),
    slice: jest.fn()
  }));
};

/**
 * Mock FileReader API
 */
export const mockFileReaderAPI = () => {
  /**
   * Mock FileReader constructor
   *
   * This is useful for testing file reading functionality
   */
  // @ts-expect-error - Mock doesn't need full FileReader constructor interface
  global.FileReader = jest.fn().mockImplementation(() => ({
    readAsText: jest.fn(),
    readAsDataURL: jest.fn(),
    readAsArrayBuffer: jest.fn(),
    readAsBinaryString: jest.fn(),
    abort: jest.fn(),
    EMPTY: 0,
    LOADING: 1,
    DONE: 2,
    readyState: 0,
    result: null,
    error: null,
    onload: null,
    onerror: null,
    onabort: null,
    onloadstart: null,
    onloadend: null,
    onprogress: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
};

/**
 * Mock FormData API
 */
export const mockFormDataAPI = () => {
  /**
   * Mock FormData constructor
   *
   * This is useful for testing form submissions
   */
  global.FormData = jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    delete: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    set: jest.fn(),
    forEach: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn()
  }));
};

/**
 * Apply all storage mocks
 */
export const mockStorageAPIs = () => {
  mockWebStorage();
  mockFileAPI();
  mockFileReaderAPI();
  mockFormDataAPI();
};
