"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUtils = exports.testUtils = exports.reporting = exports.tools = exports.git = exports.performance = exports.config = exports.RuleCacheImpl = void 0;
const utils_1 = require("@typescript-eslint/utils");
class RuleCacheImpl {
    constructor(maxSize = 1000, ttl = 3600000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return undefined;
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return undefined;
        }
        return item.value;
    }
    set(key, value) {
        // Clean up expired entries
        this.cleanExpiredEntries();
        // Remove oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    clear() {
        this.cache.clear();
    }
    cleanExpiredEntries() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }
}
exports.RuleCacheImpl = RuleCacheImpl;
exports.config = {
    getDefaultConfig() {
        return {
            cache: {
                enabled: true,
                maxSize: 1000,
                ttl: 3600000
            }
        };
    },
    getCommonSchema() {
        return {
            type: 'object',
            properties: {
                cache: {
                    type: 'object',
                    properties: {
                        enabled: { type: 'boolean' },
                        maxSize: { type: 'number' },
                        ttl: { type: 'number' }
                    }
                }
            }
        };
    }
};
exports.performance = {
    checkLimits(context, options) {
        var _a, _b;
        const sourceCode = context.getSourceCode();
        const content = sourceCode.text;
        if (((_a = options.limits) === null || _a === void 0 ? void 0 : _a.maxFileSize) &&
            content.length > options.limits.maxFileSize) {
            return false;
        }
        const lines = sourceCode.lines.length;
        if (((_b = options.limits) === null || _b === void 0 ? void 0 : _b.maxLines) && lines > options.limits.maxLines) {
            return false;
        }
        return true;
    },
    shouldSkipNode(node, options) {
        var _a, _b;
        if (!node || !options)
            return true;
        if (((_a = options.optimization) === null || _a === void 0 ? void 0 : _a.skipComments) && node.type === 'Program') {
            const comments = node.comments;
            return comments !== undefined && comments.length > 0;
        }
        if (((_b = options.optimization) === null || _b === void 0 ? void 0 : _b.skipImports) &&
            (node.type === 'ImportDeclaration' ||
                node.type === 'ExportAllDeclaration' ||
                node.type === 'ExportNamedDeclaration')) {
            return true;
        }
        return false;
    },
    createNodeKey(context, node) {
        var _a, _b;
        return `${context.getFilename()}:${(_a = node.range) === null || _a === void 0 ? void 0 : _a[0]}:${(_b = node.range) === null || _b === void 0 ? void 0 : _b[1]}`;
    }
};
exports.git = {
    getGitInfo(_context) {
        return null;
    },
    getBranchConfig(_branch, _config) {
        return null;
    }
};
exports.tools = {
    async getIntegratedConfig(_context, options) {
        return options;
    }
};
exports.reporting = {
    getLocationDetails(_node) {
        return {};
    },
    createMessage(template, _data) {
        return template;
    }
};
exports.testUtils = {
    createRuleTester() {
        return new utils_1.TSESLint.RuleTester({
            parser: require.resolve('@typescript-eslint/parser'),
            parserOptions: {
                ecmaVersion: 2018,
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true
                }
            }
        });
    },
    generateValidTests(cases) {
        return cases.map((testCase) => {
            if (typeof testCase === 'string') {
                return { code: testCase };
            }
            return testCase;
        });
    },
    generateInvalidTests(cases) {
        return cases.map((testCase) => ({
            ...testCase,
            errors: Array.isArray(testCase.errors)
                ? testCase.errors
                : [testCase.errors]
        }));
    }
};
class TestUtils {
    getGitInfo() {
        return {};
    }
    getBranchConfig() {
        return {};
    }
    getLocationDetails() {
        return {};
    }
    createMessage(template) {
        return template;
    }
}
exports.TestUtils = TestUtils;
//# sourceMappingURL=shared.js.map