import { TSESLint, TSESTree } from '@typescript-eslint/utils';
export interface RuleCache {
    get(key: string): boolean | undefined;
    set(key: string, value: boolean): void;
    clear(): void;
}
export declare class RuleCacheImpl implements RuleCache {
    private cache;
    private maxSize;
    private ttl;
    constructor(maxSize?: number, ttl?: number);
    get(key: string): boolean | undefined;
    set(key: string, value: boolean): void;
    clear(): void;
    private cleanExpiredEntries;
}
export declare const config: {
    getDefaultConfig(): Record<string, any>;
    getCommonSchema(): Record<string, any>;
};
export declare const performance: {
    checkLimits(context: TSESLint.RuleContext<string, unknown[]>, options: any): boolean;
    shouldSkipNode(node: TSESTree.Node | null, options: any): boolean;
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