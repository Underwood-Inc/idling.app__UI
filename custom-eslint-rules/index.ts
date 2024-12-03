import type { TSESLint } from '@typescript-eslint/utils';
import declarationSpacing from './rules/declaration-spacing';
import linkTargetBlank from './rules/link-target-blank';

interface ESLintPlugin {
  rules: {
    [key: string]: TSESLint.RuleModule<string, Array<unknown>>;
  };
}

const plugin: ESLintPlugin = {
  rules: {
    'link-target-blank': linkTargetBlank,
    'declaration-spacing': declarationSpacing
  }
};

export = plugin;
