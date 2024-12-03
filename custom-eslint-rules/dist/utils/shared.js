"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestUtils = exports.testUtils = exports.reporting = exports.tools = exports.git = exports.performance = exports.config = exports.RuleCacheImpl = void 0;
const utils_1 = require("@typescript-eslint/utils");
/**
 * Implementation of RuleCache that includes automatic cache expiration and size limiting.
 * This helps prevent memory leaks by automatically removing old or excess entries.
 *
 * @example
 * const cache = new RuleCacheImpl(1000, 3600000); // 1000 items max, 1 hour TTL
 * cache.set('myKey', true);
 * const value = cache.get('myKey'); // returns true
 * cache.clear(); // removes all entries
 */
class RuleCacheImpl {
    /**
     * Creates a new cache instance
     * @param maxSize Maximum number of items to store (defaults to 1000)
     * @param ttl Time-to-live in milliseconds (defaults to 1 hour)
     */
    constructor(maxSize = 1000, ttl = 3600000) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl;
    }
    /**
     * Retrieves a value from the cache. Returns undefined if the key doesn't exist
     * or if the entry has expired.
     *
     * @example
     * cache.get('myKey'); // returns true if exists and not expired
     */
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
    /**
     * Stores a value in the cache. Automatically removes expired entries and
     * oldest entries if the cache is full.
     *
     * @example
     * cache.set('myKey', true);
     */
    set(key, value) {
        // Clean up expired entries first
        this.cleanExpiredEntries();
        // If cache is full, remove oldest entry
        if (this.cache.size >= this.maxSize) {
            const oldestKey = Array.from(this.cache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    /**
     * Removes all entries from the cache
     *
     * @example
     * cache.clear(); // empties the entire cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Internal method to remove expired entries from the cache
     * This helps maintain cache size and removes stale data
     */
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
/**
 * Configuration utilities for ESLint rules
 */
exports.config = {
    /**
     * Returns the default configuration for rules
     *
     * @example
     * const defaultConfig = config.getDefaultConfig();
     * console.log(defaultConfig.cache.enabled); // true
     */
    getDefaultConfig() {
        return {
            cache: {
                enabled: true,
                maxSize: 1000,
                ttl: 3600000
            }
        };
    },
    /**
     * Returns the JSON schema for rule configuration
     * Used by ESLint to validate rule options
     *
     * @example
     * const schema = config.getCommonSchema();
     * // Use in ESLint rule definition
     * module.exports = {
     *   meta: {
     *     schema: [config.getCommonSchema()]
     *   }
     * };
     */
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
/**
 * Performance-related utilities for ESLint rules
 */
exports.performance = {
    /**
     * Checks if a file exceeds size or line limits
     *
     * @example
     * const context = getRuleContext();
     * const options = { limits: { maxFileSize: 1000, maxLines: 100 } };
     * if (!performance.checkLimits(context, options)) {
     *   // Skip processing large files
     *   return;
     * }
     */
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
    /**
     * Determines if a node should be skipped based on optimization rules
     *
     * @example
     * const node = getNode();
     * const options = { optimization: { skipComments: true } };
     * if (performance.shouldSkipNode(node, options)) {
     *   return; // Skip processing this node
     * }
     */
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
    /**
     * Creates a unique key for a node in a file
     * Useful for caching node-specific results
     *
     * @example
     * const node = getNode();
     * const key = performance.createNodeKey(context, node);
     * cache.set(key, someValue);
     */
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