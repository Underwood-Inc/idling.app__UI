import '@testing-library/jest-dom';

// Mock the shared utilities
jest.mock('./custom-eslint-rules/utils/shared', () => ({
  RuleCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  })),
  performance: {
    checkLimits: jest.fn().mockReturnValue(true),
    shouldSkipNode: jest.fn().mockReturnValue(false),
    createNodeKey: jest.fn().mockReturnValue('test-key')
  },
  git: {
    getGitInfo: jest.fn().mockReturnValue(null),
    getBranchConfig: jest.fn().mockReturnValue(null)
  },
  tools: {
    getIntegratedConfig: jest.fn().mockResolvedValue({})
  },
  config: {
    getDefaultConfig: jest.fn().mockReturnValue({}),
    getCommonSchema: jest.fn().mockReturnValue({})
  },
  reporting: {
    getLocationDetails: jest.fn().mockReturnValue({}),
    createMessage: jest.fn().mockReturnValue('Test message')
  }
}));
