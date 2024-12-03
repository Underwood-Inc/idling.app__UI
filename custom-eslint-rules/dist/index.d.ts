import type { TSESLint } from '@typescript-eslint/utils';
interface ESLintPlugin {
    rules: {
        [key: string]: TSESLint.RuleModule<string, Array<unknown>>;
    };
}
declare const plugin: ESLintPlugin;
export = plugin;
//# sourceMappingURL=index.d.ts.map