// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'jest-chain';

// This file is run before each test file for JEST ONLY
// DO NOT import Playwright here - it's a separate testing framework

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => ({
    get: jest.fn(),
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: () => ''
  })
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated'
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children
}));

// Mock @dicebear
jest.mock('@dicebear/collection', () => ({
  lorelei: jest.fn()
}));

jest.mock('@dicebear/core', () => ({
  createAvatar: jest.fn(() => ({
    toString: () => '<svg>mock avatar</svg>'
  }))
}));

// Mock database connections to prevent hanging
jest.mock('src/lib/db', () => ({
  __esModule: true,
  default: {
    unsafe: jest.fn().mockResolvedValue([]),
    begin: jest.fn().mockResolvedValue({
      rollback: jest.fn(),
      commit: jest.fn()
    })
  }
}));

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Suppress console warnings in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: An invalid form control') ||
        args[0].includes('Warning: componentWillReceiveProps') ||
        args[0].includes('act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('act(...)'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Set test timeout for Jest
jest.setTimeout(10000);
