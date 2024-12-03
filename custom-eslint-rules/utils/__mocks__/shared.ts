export const RuleCache = jest.fn().mockImplementation(() => ({
  get: jest.fn(),
  set: jest.fn()
}));

export const performance = {
  checkLimits: jest.fn().mockReturnValue(true),
  shouldSkipNode: jest.fn().mockReturnValue(false),
  createNodeKey: jest.fn().mockReturnValue('test-key')
};

export const git = {
  getGitInfo: jest.fn().mockReturnValue(null),
  getBranchConfig: jest.fn().mockReturnValue(null)
};

export const tools = {
  getIntegratedConfig: jest.fn().mockResolvedValue({})
};

export const config = {
  getDefaultConfig: jest.fn().mockReturnValue({}),
  getCommonSchema: jest.fn().mockReturnValue({})
};

export const reporting = {
  getLocationDetails: jest.fn().mockReturnValue({}),
  createMessage: jest
    .fn()
    .mockImplementation((_template, data) => data.reason || data.message)
};
