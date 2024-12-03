import '@testing-library/jest-dom';
const jestChain = require('jest-chain');

// Set up Jest Chain
expect.extend(jestChain);

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn()
    };
  },
  useSearchParams() {
    return {
      get: jest.fn()
    };
  }
}));

// Mock next/config
jest.mock('next/config', () => () => ({
  publicRuntimeConfig: {
    version: '1.2.3'
  }
}));
