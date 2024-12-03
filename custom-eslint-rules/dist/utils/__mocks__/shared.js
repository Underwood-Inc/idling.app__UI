"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reporting = exports.config = exports.tools = exports.git = exports.performance = exports.RuleCache = void 0;
exports.RuleCache = jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn()
}));
exports.performance = {
    checkLimits: jest.fn().mockReturnValue(true),
    shouldSkipNode: jest.fn().mockReturnValue(false),
    createNodeKey: jest.fn().mockReturnValue('test-key')
};
exports.git = {
    getGitInfo: jest.fn().mockReturnValue(null),
    getBranchConfig: jest.fn().mockReturnValue(null)
};
exports.tools = {
    getIntegratedConfig: jest.fn().mockResolvedValue({})
};
exports.config = {
    getDefaultConfig: jest.fn().mockReturnValue({}),
    getCommonSchema: jest.fn().mockReturnValue({})
};
exports.reporting = {
    getLocationDetails: jest.fn().mockReturnValue({}),
    createMessage: jest
        .fn()
        .mockImplementation((_template, data) => data.reason || data.message)
};
//# sourceMappingURL=shared.js.map