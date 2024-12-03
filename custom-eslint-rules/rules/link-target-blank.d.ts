import { TSESLint } from '@typescript-eslint/utils';

type MessageIds =
  | 'missingTarget'
  | 'missingRel'
  | 'missingAriaLabel'
  | 'invalidCustomAttribute'
  | 'missingRequiredAttribute';

type Options = [
  {
    customAttributes?: Array<{
      name: string;
      value: string;
    }>;
    urlPatterns?: Array<{
      pattern: string;
      requireAttributes?: string[];
    }>;
    cache?: {
      enabled: boolean;
      maxSize: number;
      ttl: number;
    };
  }
];

declare const rule: TSESLint.RuleModule<MessageIds, Options>;
export = rule;
