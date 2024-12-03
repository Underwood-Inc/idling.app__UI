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
export class RuleCacheImpl implements RuleCache {
  private cache: Map<string, { value: boolean; timestamp: number }>;
  private maxSize: number;
  private ttl: number;

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
  get(key: string): boolean | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

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
  set(key: string, value: boolean): void {
    // Clean up expired entries first
    this.cleanExpiredEntries();

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0][0];
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
  clear(): void {
    this.cache.clear();
  }

  /**
   * Internal method to remove expired entries from the cache
   * This helps maintain cache size and removes stale data
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Configuration utilities for ESLint rules
 */
export const config = {
  /**
   * Returns the default configuration for rules
   *
   * @example
   * const defaultConfig = config.getDefaultConfig();
   * console.log(defaultConfig.cache.enabled); // true
   */
  getDefaultConfig(): Record<string, any> {
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
  getCommonSchema(): Record<string, any> {
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
export const performance = {
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
  checkLimits(
    context: TSESLint.RuleContext<string, unknown[]>,
    options: any
  ): boolean {
    const sourceCode = context.getSourceCode();
    const content = sourceCode.text;

    if (
      options.limits?.maxFileSize &&
      content.length > options.limits.maxFileSize
    ) {
      return false;
    }

    const lines = sourceCode.lines.length;
    if (options.limits?.maxLines && lines > options.limits.maxLines) {
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
  shouldSkipNode(node: TSESTree.Node | null, options: any): boolean {
    if (!node || !options) return true;

    if (options.optimization?.skipComments && node.type === 'Program') {
      const comments = (node as TSESTree.Program).comments;
      return comments !== undefined && comments.length > 0;
    }

    if (
      options.optimization?.skipImports &&
      (node.type === 'ImportDeclaration' ||
        node.type === 'ExportAllDeclaration' ||
        node.type === 'ExportNamedDeclaration')
    ) {
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
  createNodeKey(
    context: TSESLint.RuleContext<string, unknown[]>,
    node: TSESTree.Node
  ): string {
    return `${context.getFilename()}:${node.range?.[0]}:${node.range?.[1]}`;
  }
};

export const git = {
  getGitInfo(_context: TSESLint.RuleContext<string, unknown[]>): any {
    return null;
  },

  getBranchConfig(_branch: string, _config: any): any {
    return null;
  }
};

export const tools = {
  async getIntegratedConfig(
    _context: TSESLint.RuleContext<string, unknown[]>,
    options: any
  ): Promise<any> {
    return options;
  }
};

export const reporting = {
  getLocationDetails(_node: TSESTree.Node): Record<string, any> {
    return {};
  },

  createMessage(template: string, _data: Record<string, any>): string {
    return template;
  }
};

export const testUtils = {
  createRuleTester(): TSESLint.RuleTester {
    return new TSESLint.RuleTester({
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

  generateValidTests<TOptions extends unknown[]>(
    cases: (string | TSESLint.ValidTestCase<TOptions>)[]
  ): TSESLint.ValidTestCase<TOptions>[] {
    return cases.map((testCase) => {
      if (typeof testCase === 'string') {
        return { code: testCase } as TSESLint.ValidTestCase<TOptions>;
      }
      return testCase;
    });
  },

  generateInvalidTests<MessageIds extends string, TOptions extends unknown[]>(
    cases: TSESLint.InvalidTestCase<MessageIds, TOptions>[]
  ): TSESLint.InvalidTestCase<MessageIds, TOptions>[] {
    return cases.map((testCase) => ({
      ...testCase,
      errors: Array.isArray(testCase.errors)
        ? testCase.errors
        : [testCase.errors]
    }));
  }
};

export class TestUtils {
  getGitInfo(): any {
    return {};
  }

  getBranchConfig(): any {
    return {};
  }

  getLocationDetails(): Record<string, any> {
    return {};
  }

  createMessage(template: string): string {
    return template;
  }
}
