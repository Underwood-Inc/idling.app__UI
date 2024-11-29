import { TSESLint, TSESTree } from '@typescript-eslint/utils';

export interface RuleCache {
  get(key: string): boolean | undefined;
  set(key: string, value: boolean): void;
  clear(): void;
}

export class RuleCacheImpl implements RuleCache {
  private cache: Map<string, { value: boolean; timestamp: number }>;
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 1000, ttl = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): boolean | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  set(key: string, value: boolean): void {
    // Clean up expired entries
    this.cleanExpiredEntries();

    // Remove oldest entry if cache is full
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

  clear(): void {
    this.cache.clear();
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const config = {
  getDefaultConfig(): Record<string, any> {
    return {
      cache: {
        enabled: true,
        maxSize: 1000,
        ttl: 3600000
      }
    };
  },
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

export const performance = {
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
