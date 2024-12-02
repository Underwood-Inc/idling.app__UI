import { TSESLint, TSESTree } from '@typescript-eslint/utils';
/**
 * Interface defining a cache system for storing boolean values with string keys.
 * This is useful for storing temporary results that can be reused later.
 */
export interface RuleCache {
    get(key: string): boolean | undefined;
    set(key: string, value: boolean): void;
    clear(): void;
}
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
export declare class RuleCacheImpl implements RuleCache {
    private cache;
    private maxSize;
    private ttl;
    /**
     * Creates a new cache instance
     * @param maxSize Maximum number of items to store (defaults to 1000)
     * @param ttl Time-to-live in milliseconds (defaults to 1 hour)
     */
    constructor(maxSize?: number, ttl?: number);
    /**
     * Retrieves a value from the cache. Returns undefined if the key doesn't exist
     * or if the entry has expired.
     *
     * @example
     * cache.get('myKey'); // returns true if exists and not expired
     */
    get(key: string): boolean | undefined;
    /**
     * Stores a value in the cache. Automatically removes expired entries and
     * oldest entries if the cache is full.
     *
     * @example
     * cache.set('myKey', true);
     */
    set(key: string, value: boolean): void;
    /**
     * Removes all entries from the cache
     *
     * @example
     * cache.clear(); // empties the entire cache
     */
    clear(): void;
    /**
     * Internal method to remove expired entries from the cache
     * This helps maintain cache size and removes stale data
     */
    private cleanExpiredEntries;
}
/**
 * Configuration utilities for ESLint rules
 */
export declare const config: {
    /**
     * Returns the default configuration for rules
     *
     * @example
     * const defaultConfig = config.getDefaultConfig();
     * console.log(defaultConfig.cache.enabled); // true
     */
    getDefaultConfig(): Record<string, any>;
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
    getCommonSchema(): Record<string, any>;
};
/**
 * Performance-related utilities for ESLint rules
 */
export declare const performance: {
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
    checkLimits(context: TSESLint.RuleContext<string, unknown[]>, options: any): boolean;
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
    shouldSkipNode(node: TSESTree.Node | null, options: any): boolean;
    /**
     * Creates a unique key for a node in a file
     * Useful for caching node-specific results
     *
     * @example
     * const node = getNode();
     * const key = performance.createNodeKey(context, node);
     * cache.set(key, someValue);
     */
    createNodeKey(context: TSESLint.RuleContext<string, unknown[]>, node: TSESTree.Node): string;
};
export declare const git: {
    getGitInfo(_context: TSESLint.RuleContext<string, unknown[]>): any;
    getBranchConfig(_branch: string, _config: any): any;
};
export declare const tools: {
    getIntegratedConfig(_context: TSESLint.RuleContext<string, unknown[]>, options: any): Promise<any>;
};
export declare const reporting: {
    getLocationDetails(_node: TSESTree.Node): Record<string, any>;
    createMessage(template: string, _data: Record<string, any>): string;
};
export declare const testUtils: {
    createRuleTester(): TSESLint.RuleTester;
    generateValidTests<TOptions extends unknown[]>(cases: (string | TSESLint.ValidTestCase<TOptions>)[]): TSESLint.ValidTestCase<TOptions>[];
    generateInvalidTests<MessageIds extends string, TOptions extends unknown[]>(cases: TSESLint.InvalidTestCase<MessageIds, TOptions>[]): TSESLint.InvalidTestCase<MessageIds, TOptions>[];
};
export declare class TestUtils {
    getGitInfo(): any;
    getBranchConfig(): any;
    getLocationDetails(): Record<string, any>;
    createMessage(template: string): string;
}
//# sourceMappingURL=shared.d.ts.map