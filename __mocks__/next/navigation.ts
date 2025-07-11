/**
 * Next.js Navigation Mock - Comprehensive Implementation
 * 
 * This mock covers all the navigation hooks used across our test suite
 */

export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn()
}));

export const usePathname = jest.fn(() => '/');

export const useSearchParams = jest.fn(() => ({
  get: jest.fn().mockReturnValue(null),
  getAll: jest.fn().mockReturnValue([]),
  has: jest.fn().mockReturnValue(false),
  keys: jest.fn().mockReturnValue([]),
  values: jest.fn().mockReturnValue([]),
  entries: jest.fn().mockReturnValue([]),
  forEach: jest.fn(),
  toString: jest.fn().mockReturnValue('')
}));
